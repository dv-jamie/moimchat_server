# 모임챗

http://chat.moimmoim.com  
웹소켓을 이용한 실시간 채팅 사이트입니다.  
대화방을 생성하면 참여코드를 발급 받을 수 있으며, 참여코드를 통해 대화방에 입장할 수 있습니다.
- 프론트엔드 : https://github.com/dv-jamie/moimchat_client

</br>

## 1. 제작 기간 & 참여 인원

- 2022년 3월 ~ 2022년 04월 (약 1개월)
- 개인 프로젝트

</br>

## 2. 사용 기술

### Back-end
  - Node.js
  - Express.js
  - Nginx
  - MySQL

### Front-end
  - React.js
  - Javascript
  - HTML5
  - CSS3

</br>

## 3. 시퀀스 다이어그램

![](https://user-images.githubusercontent.com/90839019/168702562-6c633129-56c8-4e27-9852-47288d76f2cf.png)

</br>

## 4. 아키텍처 구성도

![](https://user-images.githubusercontent.com/90839019/168702491-f7d18cf0-c334-43af-9b7d-b31b8ba5650b.jpg)


## 5. API 명세

| Index | Method  | URI                       | Description |
| ----- | ------- | ------------------------- | ----------- |
| 1     | POST    | /user/login               | 로그인 |
| 2     | POST    | /user/join                | 회원가입 |
| 3     | GET     | /chat/conversation        | 대화방 리스트 불러오기 |
| 4     | GET     | /chat/{id}/conversation   | 대화방 메시지 불러오기 |
| 5     | POST    | /chat/conversation        | 대화방 생성 |
| 6     | POST    | /chat/join-conversation   | 대화방 입장 |

</br>
