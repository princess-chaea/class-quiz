import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, count = 5, types = ["SHORT_ANSWER"], fileData } = await req.json();

    if (!text && !fileData) {
      return NextResponse.json({ error: "텍스트나 파일이 필요합니다." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: "Gemini API Key가 설정되지 않았습니다. .env.local 파일에 GEMINI_API_KEY를 추가해주세요." 
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const typeLabel = types.map((t: string) => {
      if (t === "MULTIPLE_CHOICE") return "선다형(2-4개 보기)";
      if (t === "SHORT_ANSWER") return "단답형";
      if (t === "OX") return "O/X 퀴즈";
      if (t === "BLANK") return "빈칸 넣기";
      return t;
    }).join(", ");

    const formatPrompt = `
      [
        {
          "q": "질문 내용",
          "options": ["보기1", "보기2", "보기3", "보기4"], // '선다형'일 경우 필수 (2~4개). 그 외 생략
          "a": "정답", // '선다형'은 options 중 하나와 일치, 'OX'는 "O" 또는 "X", '단답형'/'빈칸넣기'는 정답 단어
          "type": "MULTIPLE_CHOICE, SHORT_ANSWER, OX, 또는 BLANK",
          "blanks": [index1, index2], // '빈칸넣기'일 경우 필수. q를 공백으로 나눴을 때 정답이 될 단어의 인덱스 배열
          "points": 10
        }
      ]
    `;

    const textPrompt = `
      제공된 텍스트나 첨부된 파일을 바탕으로 초등학생들이 즐겁게 풀 수 있는 ${typeLabel} 퀴즈 문항 총 ${count}개를 생성해주세요.
      출력 형식은 반드시 아래의 JSON 배열 형식이어야 합니다. 다른 말은 덧붙이지 마세요.
      
      형식:
      ${formatPrompt}

      텍스트:
      ${text || "첨부 파일 참조"}
    `;

    const parts: any[] = [{ text: textPrompt }];
    if (fileData) {
      parts.push({
        inlineData: {
          mimeType: fileData.mimeType,
          data: fileData.data
        }
      });
    }

    const result = await model.generateContent(parts);

    const response = await result.response;
    const responseText = response.text();
    
    // Extract JSON from response (Gemini sometimes adds markdown blocks)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("AI가 유효한 JSON 형식을 생성하지 못했습니다.");
    }
    
    const questions = JSON.parse(jsonMatch[0]);
    return NextResponse.json(questions);

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
