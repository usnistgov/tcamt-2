set -e

function header_section() {
  echo "\033[1;96m\033[43m\x1B[K\n\t\t ** $1 ** \t\t\x1B[K\n\x1B[K\033[0m"
}

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
TMP_LOCAL_REPO="$(mktemp -d)"

header_section "Local Repo @ $TMP_LOCAL_REPO"

while getopts ":v:a:h: lp" flag
do
    case "${flag}" in
        a) ACMGT=${OPTARG};;
        h) CLIENT=${OPTARG};;
        v) VERSION=${OPTARG};;
        l) AS_LATEST=y;;
        p) PUSH_DOCKERHUB=y;;
    esac
done

if [ -z "$CLIENT" ]; then
    echo "Path to gov.nist.hit.resources is required. (-h)"
    exit 1
fi


if [ -z "$ACMGT" ]; then
    echo "Path to igamt-lite-acmgt is required. (-a)"
    exit 1
fi

if [ -z "$VERSION" ]; then
    echo "Image docker version required. (-v)"
    exit 1
fi

if [ -z "$AS_LATEST" ]; then
    AS_LATEST=n
fi

if [ -z "$PUSH_DOCKERHUB" ]; then
    PUSH_DOCKERHUB=n
fi

header_section "Building hit-client"
cd $CLIENT
mvn clean install -Dmaven.repo.local=$TMP_LOCAL_REPO

header_section "Building igamt-lite-acmgt"
cd $ACMGT
mvn clean install -Dmaven.repo.local=$TMP_LOCAL_REPO

header_section "Building TCAMT"
cd $ROOT_DIR
mvn clean install -Dmaven.repo.local=$TMP_LOCAL_REPO

header_section "Building Docker Image version: $VERSION"
docker buildx build --platform linux/amd64,linux/arm64 -t nist775hit/hl7v2-tcamt-webapp:$VERSION .

if [ "$AS_LATEST" == "y" ];then
  header_section "Tag version as latest"
  docker tag nist775hit/hl7v2-tcamt-webapp:$VERSION nist775hit/hl7v2-tcamt-webapp:latest
fi

if [ "$PUSH_DOCKERHUB" == "y" ];then
  docker push nist775hit/hl7v2-tcamt-webapp:$VERSION
  header_section "Image nist775hit/hl7v2-tcamt-webapp:$VERSION successfully pushed to DockerHub"
  if [ "$AS_LATEST" == "y" ];then
    docker push nist775hit/hl7v2-tcamt-webapp:latest
    header_section "Image nist775hit/hl7v2-tcamt-webapp:latest successfully pushed to DockerHub"
  fi
fi