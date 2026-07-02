pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_IMAGE          = 'axsibille/tasklist-backend'
        IMAGE_TAG             = "${BUILD_NUMBER}"
        SONAR_PROJECT_KEY     = 'cicd-tasklist-backend-certifiant1'
        SONAR_PROJECT_NAME    = 'Tasklist Backend'
    }

    stages {
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        stage('Generate Prisma Client') {
            steps {
                sh 'npx prisma generate'
            }
        }
        stage('Unit Tests') {
            steps {
                sh 'mkdir -p reports'
                sh 'npm run test:coverage'
                sh 'cp reports/junit.xml reports/junit-unit.xml'
            }
            post {
                always {
                    junit testResults: 'reports/junit-unit.xml', allowEmptyResults: true
                    publishHTML(target: [allowMissing: false, alwaysLinkToLastBuild: true, keepAll: true, reportDir: 'coverage', reportFiles: 'index.html', reportName: 'Code Coverage Report'])
                }
            }
        }
        stage('E2E Tests') {
            steps {
                sh 'npm run test:e2e'
                sh 'cp reports/junit.xml reports/junit-e2e.xml'
            }
            post {
                always {
                    junit testResults: 'reports/junit-e2e.xml', allowEmptyResults: true
                }
            }
        }
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    script {
                        def scannerHome = tool 'SonarScanner'
                        sh "${scannerHome}/bin/sonar-scanner -Dsonar.projectKey=${SONAR_PROJECT_KEY} -Dsonar.projectName='${SONAR_PROJECT_NAME}' -Dsonar.sources=src -Dsonar.exclusions=src/__tests__/** -Dsonar.tests=src/__tests__ -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info"
                    }
                }
            }
        }
        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${IMAGE_TAG} -t ${DOCKER_IMAGE}:latest ."
            }
        }
        stage('Security Scan (Trivy)') {
            steps {
                sh 'mkdir -p security-reports'
                sh "trivy image --format json --output security-reports/trivy-report.json --severity HIGH,CRITICAL --exit-code 0 ${DOCKER_IMAGE}:${IMAGE_TAG}"
                sh "trivy image --format table --output security-reports/trivy-report.txt --severity HIGH,CRITICAL --exit-code 0 ${DOCKER_IMAGE}:${IMAGE_TAG}"
            }
            post {
                always {
                    archiveArtifacts artifacts: 'security-reports/*', fingerprint: true
                }
            }
        }
        stage('Generate SBOM') {
            steps {
                sh 'mkdir -p sbom'
                sh "trivy image ${DOCKER_IMAGE}:${IMAGE_TAG} --format cyclonedx --output sbom/sbom-cyclonedx.json"
                sh "trivy image ${DOCKER_IMAGE}:${IMAGE_TAG} --format spdx-json --output sbom/sbom-spdx.json"
            }
            post {
                always {
                    archiveArtifacts artifacts: 'sbom/*.json', fingerprint: true
                }
            }
        }
        stage('Push to Docker Hub') {
            steps {
                sh "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
                sh "docker push ${DOCKER_IMAGE}:${IMAGE_TAG}"
                sh "docker push ${DOCKER_IMAGE}:latest"
            }
        }
    }

    post {
        always {
            sh 'docker logout || true'
            cleanWs()
        }
    }
}
