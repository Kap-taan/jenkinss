# Instructions for Execution

- To start the execution, follow these steps:

1. Use the command `npm install` to ensure you have installed all the dependencies.

2. Create a new file for the city based on the zip code or post office, etc.

3. Replace the path of the "addressArray" with the new array list for the city in main.js. This array should be stored in the `./src/StoreAddress` directory.

4. Configure "wantToCrawl=true/false", "toFilterAndCreateCSV = true/false" , "city = cityName" based on requirement.

5. Ensure to set the start (i.e startPoint=0) and end points (i.e endPoint=100) based on the size of the `addressArray`. It's advisable to scrape data in batches, such as 100 locations at a time, rather than all at once.

6. Use the command `npm start`.

7. After scraping the data, it will prompt the user to enter the index corresponding to the desired city since there may be multiple cities with the same name.

8. The output CSV file will be located in the "./data" folder.

## Execution Example

```bash
npm start
```

/var/jenkins_home/workspace/jenkinss

ERROR: open /var/jenkins_home/.docker/ca.pem: no such file or directory

docker run --name jenkins-blueocean --restart=on-failure --detach \
 --network jenkins \
 --volume jenkins-data:/var/jenkins_home \
 --publish 8080:8080 --publish 50000:50000 myjenkins-blueocean:2.414.2
myjenkins-blueocean:2.414.2
