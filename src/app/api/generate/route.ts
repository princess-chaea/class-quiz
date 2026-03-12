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

    // Format prompt based on selected types
    const isMixed = types.includes("SHORT_ANSWER") && types.includes("MULTIPLE_CHOICE");
    const isOnlyMultipleChoice = types.includes("MULTIPLE_CHOICE") && !types.includes("SHORT_ANSWER");
    
    const typeLabel = isMixed 
      ? "단답형과 4지선다형이 골고루 섞인" 
      : (isOnlyMultipleChoice ? "4지선다형" : "단답형");

    const formatPrompt = isMixed
      ? `
      [
        {
          "q": "질문 내용",
          "options": ["보기1", "보기2", "보기3", "보기4"], // 4지선다형일 경우 필수. 단답형일 경우 생략
          "a": "정답", // 4지선다형의 경우 options 배열의 값 중 하나와 정확히 일치해야 함
          "type": "MULTIPLE_CHOICE 또는 SHORT_ANSWER",
          "points": 10
        }
      ]
      `
      : (isOnlyMultipleChoice ? `
      [
        {
          "q": "질문 내용",
          "options": ["보기1", "보기2", "보기3", "보기4"],
          "a": "정답 (options 배열의 값 중 하나와 정확히 일치해야 함)",
          "type": "MULTIPLE_CHOICE",
          "points": 10
        }
      ]
      ` : `
      [
        {
          "q": "질문 내용",
          "a": "정답(단답형)",
          "type": "SHORT_ANSWER",
          "points": 10
        }
      ]
      `);

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
