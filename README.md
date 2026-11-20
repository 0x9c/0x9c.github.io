# 0x9c.github.io

Astro로 만든 개인 블로그입니다. Pages CMS에서 GitHub로 로그인해 글, 사진, 상단 메뉴를 관리할 수 있습니다.

## 처음 설정하기

1. GitHub 저장소의 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 설정합니다.
2. 이 저장소의 변경 사항을 GitHub `main` 브랜치에 올립니다.
3. 저장소의 **Actions** 탭에서 배포가 끝나면 GitHub Pages 설정에서 사이트를 확인합니다.
4. [Pages CMS](https://app.pagescms.org/)에 GitHub 계정으로 로그인하고, Pages CMS GitHub App이 이 저장소에 접근하도록 설치합니다. 설치할 때 이 저장소만 선택할 수 있습니다.
5. Pages CMS에서 `0x9c/0x9c.github.io`와 `main` 브랜치를 선택합니다.

Pages CMS는 별도 서비스이며, GitHub 저장소에 수정 사항을 저장합니다. 기본 설정에서는 저장 후 GitHub Actions가 사이트를 다시 빌드하고 배포합니다.

## 사용자 지정 도메인

이 프로젝트는 `https://blog.rom.kr`을 기준 주소로 사용합니다. GitHub 저장소의 **Settings → Pages → Custom domain**에 `blog.rom.kr`을 등록하고, Cloudflare의 `rom.kr` DNS에서 `blog` 레코드가 `0x9c.github.io`를 가리키도록 설정해야 합니다. 처음 연결할 때는 CNAME을 **DNS only**로 두고 GitHub의 DNS 검사와 인증서 발급을 확인합니다.

현재 `blog.rom.kr`에 연결된 기존 서비스가 있으므로 DNS 레코드를 바꾸면 해당 주소는 새 블로그를 가리키게 됩니다. GitHub Actions 방식에서는 `CNAME` 파일만으로 사용자 지정 도메인이 설정되지 않으며, GitHub Pages 설정도 필요합니다. DNS 및 인증서가 준비되면 Pages 설정에서 **Enforce HTTPS**를 켭니다.

## 글과 사진 올리기

1. Pages CMS에서 **블로그 글**을 선택한 다음 새 글을 만듭니다.
2. 제목, 글 소개, 작성일과 본문을 입력합니다.
3. **대표 사진**에서 사진을 선택하거나 업로드합니다. 본문 편집기에서도 사진을 삽입할 수 있습니다.
4. 저장하면 배포가 시작됩니다. 글을 공개하고 싶지 않으면 **임시 저장**을 켭니다. 임시 글은 사이트에 표시되지 않지만 공개 저장소에는 저장됩니다.

업로드된 사진은 저장소의 `public/uploads/`에 보관됩니다.

## 상단 메뉴 바꾸기

Pages CMS의 **상단 메뉴**에서 메뉴 이름과 연결 주소를 수정하거나 항목을 추가·삭제·이동합니다. 예를 들어 글 목록 주소는 `/blog/`, 소개 페이지 주소는 `/about/`입니다. 외부 사이트는 `https://`로 시작하는 주소를 넣습니다.

새 일반 페이지를 만들려면 **소개 등 일반 페이지**에서 글을 작성하고 파일명을 지정합니다. 예를 들어 파일명을 `projects.md`로 만들었다면 메뉴 주소에 `/projects/`를 입력합니다. `blog`, `themes`, `rss.xml` 등 이미 사용 중인 주소는 피하세요.

블로그 이름과 첫 화면 문구는 **블로그 기본 설정**에서 변경할 수 있습니다.

## 테마 바꾸기

1. [테마 미리보기](https://blog.rom.kr/themes/)에서 각 테마를 눌러 실제 블로그의 첫 화면을 확인합니다. 미리보기는 공개 블로그의 테마를 변경하지 않습니다.
2. Pages CMS의 **블로그 기본 설정 → 블로그 테마**에서 원하는 테마를 선택하고 저장합니다.
3. GitHub Actions 배포가 끝나면 변경된 테마가 사이트 전체에 적용됩니다. 글, 사진과 메뉴는 그대로 유지됩니다.

## 로컬에서 미리 보기

```powershell
npm install
npm run dev
```

터미널에 표시된 주소를 브라우저에서 엽니다. 배포 전에는 다음 명령으로 검사하고 빌드할 수 있습니다.

```powershell
npm run check
npm run build
```
