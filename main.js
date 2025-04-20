import { Client, Databases, Query, Permission, Role } from "appwrite";

console.log('main.js loaded');

const client = new Client();
client
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('6803983a00018abf558b');

const databases = new Databases(client);

// Input Validation for Number-Only Textareas
const titleInput = document.getElementById('title');
const textInput = document.getElementById('text');

const validateNumberInput = (inputElement) => {
    inputElement.addEventListener('input', () => {
        const currentValue = inputElement.value;
        const sanitizedValue = currentValue.replace(/[^0-9]/g, ''); // Remove non-numeric characters
        if (currentValue !== sanitizedValue) {
            inputElement.value = sanitizedValue; // Update input value with the sanitized version
        }
    });
};

validateNumberInput(titleInput);
validateNumberInput(textInput);

// SHA-512 hash of the delete password (no salt)
const hashed_adminPassword = "962c67e328b140b07f1ae65ff959bf970fed2891f10484d8a2f56e48aba1f67dab24778a8c5ad32f809d608b84714ff049e54a6635ca5aed519a78995476b44d";

// Function to hash the password
const hashPassword = async (password) => {
    // Convert the password and salt to an array of numbers (UInt8Array)
    const passwordBytes = new TextEncoder().encode(password); //concatenate the salt and the password
    // Hash the password using SHA-512
    const hashBuffer = await crypto.subtle.digest("SHA-512", passwordBytes);
    // Convert the hash buffer to a hex string for easy storage
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};

// Function to list all documents
const listAllDocuments = () => {
    let promise = databases.listDocuments(
        "68039b9b000aefa4e2bf", // Replace with your database ID
        "68039ba400027d4de1da" // Replace with your collection ID
    );

    promise.then(
        function (response) {
            console.log("listAllData:", response);
            if (response.documents.length > 0) {
                // Display the data in the results div
                let output = "<h2>All Phone Numbers and Strikes:</h2><ul>";
                for (const document of response.documents) {
                    output += `<li><strong>${document["Phone-Number"]}:</strong> ${document.Strikes}</li>`;
                }
                output += "</ul>";
                document.getElementById('results').innerHTML = output;
            } else {
                document.getElementById('results').innerHTML = "No phone numbers found in the database.";
            }
        },
        function (error) {
            console.log(error);
        }
    );
};

const listDocuments = (queries) => {
    let promise = databases.listDocuments(
        "68039b9b000aefa4e2bf",
        "68039ba400027d4de1da",
        queries
    );

    promise.then(
        function (response) {
            console.log("listDocuments:", response);
            if (response.documents.length > 0) {
                const { "Phone-Number":phoneNumber, Strikes } = response.documents[0];
                document.getElementById('results').innerHTML = `The number of strikes for phone number "${phoneNumber}" is ${Strikes}`;
            }
            else {
                document.getElementById('results').innerHTML = `No phone number matching "${document.getElementById('title').value}" was found.`;
            }
        },
        function (error) {
            console.log(error);
        }
    );
};

const deleteEntry = async (titleText) => {
    const promiseList = await databases.listDocuments(
        "68039b9b000aefa4e2bf", // Replace with your database ID
        "68039ba400027d4de1da", // Replace with your collection ID
        [Query.equal('Phone-Number', String(titleText))]
    );
    if (promiseList.total === 0) {
        alert("Entry not found.");
    }
    else {
        await databases.deleteDocument(
            "68039b9b000aefa4e2bf", // Replace with your database ID
            "68039ba400027d4de1da", // Replace with your collection ID
            titleText
        );
        alert("Phone number deleted successfully.");
    }

};

document.getElementById('searchTitle').addEventListener('click', () => {
    const titleText = document.getElementById('title').value;
    console.log('Searching for:', titleText);
    listDocuments([Query.equal('Phone-Number', titleText)]);
});

document.getElementById('uploadText').addEventListener('click', () => {
    const titleText = document.getElementById('title').value;
    const mainText = document.getElementById('text').value;
    const promiseList = databases.listDocuments(
      "68039b9b000aefa4e2bf",
        "68039ba400027d4de1da",
        [
            Query.equal('Phone-Number', String(titleText))
        ]
    );

    promiseList.then(
        function (response) {
            if (response.total === 0) {
              
                console.log("no hay");
                let promise = databases.createDocument(
                  '68039b9b000aefa4e2bf',
                    '68039ba400027d4de1da',
                    titleText,
                    { "Phone-Number": titleText, Strikes: mainText },
                    [
                        Permission.read(Role.any()),
                        Permission.write(Role.any())
                    ]
                );
                promise.then(
                    function (response) {
                        console.log("createDocument:", response);
                        document.getElementById('results').innerHTML = `Successfully uploaded phone number: ${titleText} with strikes: ${mainText}`;
                    },
                    function (error) {
                        console.log(error);
                    }
                );
            } else {
                console.log("hay");
                let promise = databases.updateDocument(
                    '68039b9b000aefa4e2bf',
                    '68039ba400027d4de1da',
                    titleText,
                    { Strikes: mainText },
                    [
                        Permission.read(Role.any()),
                        Permission.write(Role.any())
                    ]
                );
                promise.then(
                    function (response) {
                        console.log("updateDocument:", response);
                        document.getElementById('results').innerHTML = `Successfully uploaded phone number: ${titleText} with strikes: ${mainText}`;
                    },
                    function (error) {
                        console.log(error);
                    }
                );
            }
        },
        function (error) {
            console.log(error);
        }
    );
});

// Event listener for the "List All" button
document.getElementById('listAll').addEventListener('click', () => {
    listAllDocuments();
});
// Event listener for the "Delete Entry" button
document.getElementById('deleteEntry').addEventListener('click', async () => {
    const titleText = document.getElementById('title').value;
    deleteEntry(titleText);
});

// Event listener for the "Admin Mode" button
document.getElementById('adminMode').addEventListener('click', async () => {
    const enteredPassword = prompt("Enter the admin password:");
    const hashedPassword = await hashPassword(enteredPassword);

    if (hashedPassword === hashed_adminPassword) {
        // Show admin buttons
        const adminButtons = document.querySelectorAll('.admin-button');
        adminButtons.forEach(button => {
            button.style.display = 'block';
        });
    } else {
        alert("Incorrect password.");
    }
});
