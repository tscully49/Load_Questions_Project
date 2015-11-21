#Loaded Questions:

## Loaded Questions game play
- Game with ulimited number of people
- A question is asked to everyone, each player answers question individually
- People get points for guessing who answered each question each way
- Time limit in which they have to make their guesses by 

## Techonologies:
- node.js
- jade (templating language)
- socket.io
- bower (package manager)
- Bootstrap
- Jquery

## Workflow: 
1. Host logs in first and has control over each round
2. players will connect (google account)
3. Host will start game which stops new players from joining
4. A question will be asked, people will have a set time to answer (if they don't answer, they do not participate in the voting)
5. After time is up, a new timer starts where people will make guesses on who answered what question
6. At end of time, the answers will be shown, and points awarded accordingly, host will then choose when to start next round 

##URL:
http://loadedquestionsproject.cloudapp.net:3000/
