@ECHO OFF
setlocal

echo [DEBUG] Starting Maven Wrapper...
set "MAVEN_PROJECTBASEDIR=%CD%"
echo [DEBUG] Current Directory: %MAVEN_PROJECTBASEDIR%

if not exist "%MAVEN_PROJECTBASEDIR%\.mvn" (
    echo [ERROR] .mvn folder not found in %MAVEN_PROJECTBASEDIR%
    exit /b 1
)

set "WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
echo [DEBUG] Looking for: %WRAPPER_JAR%

if not exist "%WRAPPER_JAR%" (
    echo [WARNING] maven-wrapper.jar not found.
    echo [DEBUG] Trying to download...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.4/maven-wrapper-3.3.4.jar' -OutFile '%WRAPPER_JAR%'}"
    if not exist "%WRAPPER_JAR%" (
        echo [ERROR] Download failed. Please download https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.4/maven-wrapper-3.3.4.jar manually and place it in .mvn/wrapper/
        exit /b 1
    )
    echo [DEBUG] Download successful.
)

echo [DEBUG] Starting Java...
java -Dmaven.multiModuleProjectDirectory="%MAVEN_PROJECTBASEDIR%" -classpath "%WRAPPER_JAR%" org.apache.maven.wrapper.MavenWrapperMain %*
