import { Client, Account, Databases, Storage, ID } from "appwrite";

const client = new Client();

client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Fetch Events from Appwrite Database
export const fetchEvents = async () => {
    try {
        const response = await databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_COLLECTION_ID
        );
        return response.documents;
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
};

// Fetch a single event by ID from Appwrite Database
export const getEventDetails = async (eventId) => {
    // More robust validation
    if (!eventId || typeof eventId !== 'string') {
        const error = new Error(`Invalid eventId: ${eventId}`);
        error.name = 'InvalidEventIdError';
        throw error;
    }

    try {
        if (!import.meta.env.VITE_APPWRITE_DATABASE_ID ||
            !import.meta.env.VITE_APPWRITE_COLLECTION_ID) {
            throw new Error('Appwrite configuration is missing');
        }

        const response = await databases.getDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_COLLECTION_ID,
            eventId
        );

        if (!response) {
            throw new Error('Event not found');
        }

        return response;
    } catch (error) {
        console.error('Event fetch failed:', {
            error,
            eventId,
            time: new Date().toISOString()
        });
        throw error; // Re-throw for component to handle
    }
};

export const createOrder = async (orderData) => {
    try {
        const response = await databases.createDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_ID, // Correct collection ID
            ID.unique(),
            {
                userId: orderData.userId,
                ticketId: orderData.ticketId,
                eventId: orderData.eventId,
                transactionId: orderData.transactionId,
                quantity: orderData.quantity,
                singleTicketPrice: orderData.singleTicketPrice,
                subtotal: orderData.subtotal,
                taxGST: orderData.taxGST,
                internetHandlingFee: orderData.internetHandlingFee,
                totalAmount: orderData.totalAmount,
                // status: "pending", // Additional field if needed
                // createdAt: new Date().toISOString() // Additional field if needed
            }
        );
        return response;
    } catch (error) {
        console.error("Error creating order:", error);
        throw error;
    }
};

// In your appwriteConfig.js or similar
export const createTicket = async (orderData) => {
    try {
        const databases = new Databases(client);
        const storage = new Storage(client);

        // Generate QR code (you'll need a QR code generation library)
        const qrCodeData = `ticket:${orderData.eventId}:${orderData.userId}:${Date.now()}`;
        const qrCodeBlob = await generateQRCode(qrCodeData); // Implement this function

        // Upload QR code to storage
        const qrFileId = ID.unique();
        await storage.createFile(
            import.meta.env.VITE_APPWRITE_TICKET_QRs_BUCKET_ID,
            qrFileId,
            qrCodeBlob
        );

        // Create ticket document
        const ticketDoc = await databases.createDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_TICKETS_COLLECTION_ID, // Your tickets collection ID
            ID.unique(),
            {
                eventName: orderData.eventName,
                eventSub_name: orderData.eventSub_name || '',
                eventDate: orderData.eventDate,
                eventTime: orderData.eventTime,
                eventLocation: orderData.eventLocation,
                totalAmountPaid: orderData.totalAmount,
                category: orderData.ticketCategory,
                userId: orderData.userId,
                eventId: orderData.eventId,
                qrCodeFileId: qrFileId,
                quantity: orderData.quantity,
                pricePerTicket: orderData.singleTicketPrice,
                userName: orderData.userName // Make sure to pass this from the order
            }
        );

        return ticketDoc;
    } catch (error) {
        console.error("Error creating ticket:", error);
        throw error;
    }
};

export const getCurrentUser = async () => {
    try {
        const user = await account.get();
        return user;
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
};

export const getSingleEventData = async (eventId) => {
    try {
        const event = await getEventDetails(eventId);
        return {
            ...event,
            $id: event.$id,
            eventName: event.name,
            ticketPrice: event.price,
            ticketImage: event.imageField || event.image,
            eventBio: event.description
        };
    } catch (error) {
        console.error('Failed to transform event data:', error);
        throw error;
    }
};
export const orderEventTicket = createOrder;

// Add these to your existing exports
export const createTransaction = async (transactionData) => {
    try {
        const response = await databases.createDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_TRANSACTIONS_COLLECTION_ID,
            ID.unique(),
            transactionData
        );
        return response;
    } catch (error) {
        console.error('Error creating transaction:', error);
        throw error;
    }
};

export const getRazorpayKey = () => {
    return import.meta.env.VITE_RAZORPAY_KEY_ID;
};

export const updateTicketQuantity = async (eventId, ticketName, quantityBooked) => {
    try {

        const event = await databases.getDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_COLLECTION_ID,
            eventId
        );


        const updatedCategories = event.categories.map(category => {
            const [name, price, quantity, ...phaseParts] = category.split(':').map(p => p.trim());
            const phase = phaseParts.join(':');
            
            if (name === ticketName.split(' - ')[0]) {
                const newQuantity = Math.max(parseInt(quantity) - quantityBooked, 0);
                return phase ? `${name}:${price}:${newQuantity}:${phase}` 
                            : `${name}:${price}:${newQuantity}`;
            }
            return category;
        });

        // Calculate new ticketsLeft value
        const currentTicketsLeft = parseInt(event.ticketsLeft) || 0;
        const newTicketsLeft = Math.max(0, currentTicketsLeft - quantityBooked);

        // Update both fields in a single operation
        const result = await databases.updateDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_COLLECTION_ID,
            eventId,
            { 
                categories: updatedCategories,
                ticketsLeft: newTicketsLeft.toString() 
            }
        );
        return true;
    } catch (error) {
        console.error('Error updating ticket quantity:', error);
        throw error;
    }
};


//  Real-time Subscription Function
export const subscribeToEvents = (callback) => {
    return client.subscribe(
        `databases.${import.meta.env.VITE_APPWRITE_DATABASE_ID}.collections.${import.meta.env.VITE_APPWRITE_COLLECTION_ID}.documents`,
        (response) => {
            console.log("Real-time Event Triggered:", response);
            callback(); // Jab bhi event add/update/delete ho, yeh callback chalega
        }
    );
};

//  Get Image URL from Appwrite Storage
export const getImageUrl = (fileId) => {
    return `${import.meta.env.VITE_APPWRITE_ENDPOINT}/v1/storage/buckets/${import.meta.env.VITE_APPWRITE_BUCKET_ID}/files/${fileId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT}`;
};

//  Upload Profile Image to Appwrite Storage
export const uploadProfileImage = async (file) => {
    try {
        const response = await storage.createFile(
            import.meta.env.VITE_APPWRITE_BUCKET_ID,
            "unique()",
            file
        );
        return response.$id;
    } catch (error) {
        console.error("Error uploading image:", error);
        return null;
    }
};


// Login function with role-based redirection
export const loginWithRoleCheck = async (email, password, navigate) => {
    try {
        const session = await account.createEmailPasswordSession(email, password);
        const user = await account.get();

        const response = await databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
            [
                `email=${user.email}`
            ]
        );

        if (response.documents.length > 0) {
            const userData = response.documents[0];
            if (userData.label === "admin") {
                navigate("/admin-dashboard");
            } else {
                navigate("/");
            }
        } else {
            throw new Error("User data not found");
        }
    } catch (error) {
        console.error("Login error:", error);
        throw new Error("Invalid email or password");
    }
};

export { client, Databases, Storage, ID };