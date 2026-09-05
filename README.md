# maple-demage-skin-simulator
DEMO (https://0407chan.github.io/maple-demage-skin-simulator/)

## Simulate MapleStory Damage Skin
- Mushrum will never die. don't worry

![2021 11 27 시연](https://user-images.githubusercontent.com/19217576/143809414-1857b9d5-1a82-49a1-911d-5642ff4d9983.gif)

## Select Damage Skin
- you can select every DamageSkins on KMS 367. It will keep up to date.

![2021 11 27 뎀스선택](https://user-images.githubusercontent.com/19217576/143809504-a13f1b58-27c9-4dad-885d-52461d212e9f.gif)

## Setting
- you can set MaxDamage, MinDamage and Critical Rate
- MaxNumber of damage is 150,000,000,000
- Min number of damage is 1
- Max number of Critical Rate is 100
- as sama as KMS

![2021 11 27 세팅창](https://user-images.githubusercontent.com/19217576/143809672-124208c7-42a2-4fd3-9fb3-f9b3e75e33bd.png)


## With React
```
bun i     // to install package

bun dev // to start ploject on local
```

## Google Analytics

몬스터·데미지 스킨·설정·공격 행동을 한국어 GA4 이벤트로 수집합니다. 이벤트 및 맞춤 측정기준 구성은 [GA4 이벤트 설계](./docs/analytics.md)를 참고하세요.

## 액션 데미지 스킨 자산

액션 스킨은 원본 프레임을 로컬에서 APNG로 변환해 `public/generated/damage-skins`에 저장합니다.
`bun run build`는 이 파일들을 `dist`에 포함하며, 방문자는 선택한 스킨만 다운로드합니다.
프레임별 origin을 공통 캔버스에 맞추고 delay를 APNG에 기록합니다.
위치·시간 메타데이터는 원본 IMG 한 파일에서 로컬로 추출합니다.

```sh
python3 -m pip install -r scripts/requirements-action-skins.txt
bun run generate:action-skins
bun test tests/prebuiltActionSkin.test.ts
python3 -m unittest discover -s tests -p 'test_wz_img_metadata.py'
bun run build
```

`SkinMap`에 추가한 새 액션 스킨은 묶음에 포함되기 전까지 현재 WZ 버전의 API로
임시 로드합니다. 로컬 자산으로 전환할 때 생성 명령을 실행하고, PNG 파일과
`src/generated/actionDamageSkinManifest.json`을 함께 커밋합니다.
원본 다운로드 캐시는 `.cache/action-skins`에 저장되며 배포하지 않습니다.
현재 묶음의 원본은 KMS 389 기준입니다. 앱의 WZ 버전이 올라가도 같은 지역의
기존 스킨은 계속 이 로컬 파일을 사용합니다. 새 스킨을 묶음에 추가하거나 기존
원본을 갱신할 때만 생성 명령의 버전을 갱신합니다. 다른 지역에는 재사용하지 않습니다.
