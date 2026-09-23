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

## 맵 배경 탐색과 로컬 보관

배경 선택창에서 MapleStory.io의 전체 맵 목록을 이름으로 검색할 수 있습니다.
목록은 60개씩 불러오며 **더 보기**로 이어서 탐색합니다. 이름이 같은 맵도
ID가 다르면 각각 표시하고, 선택창에 맵 ID를 함께 보여줍니다.
로컬에 보관할 후보를 고를 때 맵 이름과 ID를 기록해 주세요.
선택한 맵은 새로고침 후에도 유지됩니다.

맵을 선택하고 **위치 조정**을 누르면 몬스터를 드래그하거나 방향키로
1px씩 이동할 수 있습니다. Shift를 누른 채 방향키를 누르면 10px씩 이동합니다.
발밑 십자 표시를 발판에 맞춘 뒤 **좌표 복사**를 누르세요. JSON에는 맵 ID,
맵 이름, 원본 맵 이미지 왼쪽 위 기준 X/Y, `monster-feet` 기준점이 들어갑니다.
원본 지역·버전(`region`, `wzVersion`)과 이미지 크기(`imageWidth`, `imageHeight`)도
함께 복사하므로, 나중에 같은 원본과 좌표로 배포 파일에 추가할 수 있습니다.
맵을 스크롤한 뒤에도 원본 이미지 좌표로 변환합니다. 조정 중에는 방향키가
몬스터 이동에 사용되고, **완료**를 누르면 다시 맵 탐색에 사용됩니다.
조정 위치는 현재 세션에서 맵별로 유지되며 **초기화**로 되돌릴 수 있습니다.
맵 스크롤이 끝에 걸리거나 PC 화면보다 맵이 작아 이동하지 않더라도 복사 좌표는
유효합니다. 화면 중앙이 아니라 원하는 발판에 몬스터 발을 맞추면 됩니다.

클래식 헤네시스·헤네시스 시장은 로컬 파일을 우선 사용합니다. 전경·배경·썸네일은
`public/generated/maps`의 무손실 WebP이며, 이름·좌표·지면 높이는
`src/generated/mapManifest.json`에 저장합니다. 배경 애니메이션은 첫 프레임으로
고정합니다. 선택한 맵의 이미지와 선택창의 작은 썸네일만 불러옵니다.
배경 레이어는 원본의 이동 비율과 반복 간격을 반영합니다. 먼 배경은 고정되거나
천천히 따라오고, 자동 이동 속성이 있는 구름은 카메라가 멈춰 있어도 흐릅니다.
큰 PC 화면에서는 배경 조합을 하단에 맞춰 산·구름 띠 사이에 경계가 드러나는 것을 줄입니다.
자세한 동작과 검증 범위는 [맵 배경 문서](docs/map-backgrounds.md)를 참고하세요.

선택한 아래 두 맵도 KMS 389 원본으로 로컬 보관합니다. 몬스터 발의 기본 위치는
원본 이미지 기준입니다.

| 맵 | ID | 이미지 크기 | 발 위치 X, Y |
| --- | --- | --- | --- |
| 작은 버섯 동산 <1> | 323010000 | 1530 × 1152 | 723, 313 |
| 물과 햇살의 숲 | 450005121 | 2770 × 1090 | 1446, 884 |

카메라가 맵 끝에 도달하면 몬스터의 화면 위치를 보정해 같은 맵 좌표에 배치합니다.
**초기화**는 추가로 조정한 몬스터 이동량을 되돌립니다.

그 외 맵은 선택할 때 원본 IMG 메타데이터와 타일·오브젝트·배경 이미지를 API에서
조회해 브라우저에서 복원합니다. 발판이 빠진 완성 렌더 이미지는 사용하지 않습니다.
같은 IMG·그림은 공유하고 최대 6개 요청을 병렬 처리합니다. 진행률을 표시하며,
다른 맵을 선택하면 이전 요청을 취소합니다. 필요한 그림이 빠지면 완료로 처리하지
않고 오류와 재시도 버튼을 표시합니다. 일부 특수 형식 또는 원본 API 오류는 복원이
실패할 수 있습니다. 일반 타일·오브젝트·배경의 첫 프레임을 사용하며 NPC·포탈·몬스터는
배경에 합성하지 않습니다.

복원 결과는 브라우저 IndexedDB에 최근 6개까지 보관합니다. 브라우저 캐시는 프로젝트의
로컬 보관 맵 목록과 별개입니다. 맵 탐색만으로 `public/generated/maps`나 manifest를
추가하지 않으며, 선택한 맵과 좌표를 전달받은 뒤 지정한 맵만 다운로드합니다.
일반 `bun run build`는 저장된 파일을 `dist/generated/maps`에 복사하며,
빌드 중에도 맵 API에 접근하지 않습니다.

맵 원본을 다시 받을 때만 아래 명령을 실행합니다.

```sh
python3 -m pip install -r scripts/requirements-action-skins.txt
bun run generate:maps
bun test tests/bundledMaps.test.ts tests/map.test.ts
bun run build
```

클래식 헤네시스 두 맵의 이미지는 [MapleStory.io](https://maplestory.io/)의 GMS 83 렌더/배경 원본,
좌표는 [Cosmic의 v83 WZ 메타데이터](https://github.com/P0nk/Cosmic/tree/fec53bc7714dc0f1ae3f50b2986cdf2727e0912a/wz/Map.wz)를
사용합니다. 최신 KMS 원본에서 빈 이미지와 시간 초과가 확인되어 클래식 맵으로
로컬 보관본을 고정했습니다. 생성기는 맵 메타데이터 버전과 배경 이미지 크기를 대조하고,
빈 이미지·1픽셀 대체 이미지를 거부합니다. 메타데이터는 IMG별 XML 파일 하나로
읽어 속성마다 API를 호출하지 않습니다. 원본 캐시는 `.cache/maps`에만 저장합니다.
갱신 후에는 WebP와 manifest를 함께 커밋합니다.

추가 맵은 `scripts/map-selections.json`에 좌표 복사 JSON과 `region`, `wzVersion`을
함께 기록합니다. 이 파일의 원본 버전을 고정해서 좌표를 다른 버전 맵에 적용하지 않습니다.
아래 명령은 지정한 맵만 갱신하고 기존 로컬 맵은 유지합니다.

```sh
bun run generate:maps --map-ids 323010000
```

선택한 KMS 맵은 MapleStory.io의 같은 버전 IMG 메타데이터와 이미지를 사용합니다.
미리보기와 같이 원본 타일·오브젝트의 첫 프레임을 지면 좌표와 레이어 순서대로
항상 합성합니다. 복사한 이미지 크기와 다르면 저장을 중단합니다.
`source.foregroundMethod`에 생성 방식을 기록하며, 배경 레이어도
별도로 로컬 저장합니다. 이미지 범위 밖 좌표나 빈 대체 이미지는 저장하지 않습니다.
