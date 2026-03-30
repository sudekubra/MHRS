pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/sudekubra/MHRS.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t mhrs-app:v4 .'
            }
        }

        stage('Deploy') {
            steps {
                bat 'docker stop mhrs-app || exit /b 0'
                bat 'docker rm mhrs-app || exit /b 0'
                bat 'docker run -d --name mhrs-app -p 5000:5000 mhrs-app:v4'
            }
        }
    }
}
