import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  deleteDoc,
  getDoc,
  serverTimestamp
} from "firebase/firestore";

// Your web app's Firebase configuration
// Replace with your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDIEkgAz3QB7geZFfnwbFEhPucXfnoZ8xs",
    authDomain: "dealer-list-5094c.firebaseapp.com",
    projectId: "dealer-list-5094c",
    storageBucket: "dealer-list-5094c.firebasestorage.app",
    messagingSenderId: "765632177976",
    appId: "1:765632177976:web:7f8ed750101aac3dea43cd",
    measurementId: "G-BVWP7L0BYZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Add a dealer to the database
 * @param {Object} dealer - The dealer object
 * @returns {Promise<Object>} Success indicator and ID or error
 */
export const addDealer = async (dealer) => {
  try {
    // Ensure status is consistently stored as empty string, not null
    const dealerData = {
      ...dealer,
      status: dealer.status || '', // Convert null/undefined to empty string
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, "dealers"), dealerData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding dealer: ", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all dealers
 * @returns {Promise<Array>} Array of dealer objects
 */
export const getDealers = async () => {
  try {
    const q = query(collection(db, "dealers"), orderBy("createdAt", "desc"));
    const dealersSnapshot = await getDocs(q);
    return dealersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert timestamps to dates
      createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null,
      updatedAt: doc.data().updatedAt ? doc.data().updatedAt.toDate() : null
    }));
  } catch (error) {
    console.error("Error getting dealers: ", error);
    return [];
  }
};

/**
 * Get a single dealer by ID
 * @param {string} dealerId - The dealer ID
 * @returns {Promise<Object|null>} Dealer object or null
 */
export const getDealerById = async (dealerId) => {
  try {
    const docRef = doc(db, "dealers", dealerId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : null
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting dealer: ", error);
    return null;
  }
};

/**
 * Get dealers filtered by status and/or city
 * @param {string|null} status - Status filter
 * @param {string|null} city - City filter
 * @returns {Promise<Array>} Array of dealer objects
 */
export const getFilteredDealers = async (status = null, city = null) => {
  try {
    console.log('getFilteredDealers called with:', { status, city }); // Debug log
    
    let dealersRef = collection(db, "dealers");
    let constraints = [];
    
    // Handle status filtering
    if (status === 'blank' || status === 'pending') {
      // For blank/pending status, query for empty string
      console.log('Querying for blank/pending status');
      constraints.push(where("status", "==", ""));
    } else if (status) {
      // For specific status values
      console.log('Querying for status:', status);
      constraints.push(where("status", "==", status));
    }
    
    // Handle city filtering
    if (city) {
      console.log('Adding city filter:', city);
      constraints.push(where("city", "==", city));
    }
    
    // Always add ordering - but handle cases where we can't combine with where clauses
    try {
      constraints.push(orderBy("createdAt", "desc"));
      
      if (constraints.length > 0) {
        const q = query(dealersRef, ...constraints);
        const querySnapshot = await getDocs(q);
        const results = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null,
          updatedAt: doc.data().updatedAt ? doc.data().updatedAt.toDate() : null
        }));
        
        console.log('Query results:', results.length, 'dealers'); // Debug log
        return results;
      } else {
        console.log('No constraints, returning all dealers');
        return getDealers();
      }
    } catch (orderError) {
      console.log('Error with orderBy, trying without it:', orderError);
      
      // If orderBy fails (can happen with certain where clauses), try without it
      const constraints_no_order = [];
      
      // Re-add constraints without orderBy
      if (status === 'blank' || status === 'pending') {
        constraints_no_order.push(where("status", "==", ""));
      } else if (status) {
        constraints_no_order.push(where("status", "==", status));
      }
      
      if (city) {
        constraints_no_order.push(where("city", "==", city));
      }
      
      if (constraints_no_order.length > 0) {
        const q = query(dealersRef, ...constraints_no_order);
        const querySnapshot = await getDocs(q);
        let results = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null,
          updatedAt: doc.data().updatedAt ? doc.data().updatedAt.toDate() : null
        }));
        
        // Sort in memory since we couldn't use orderBy
        results.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return b.createdAt - a.createdAt;
        });
        
        console.log('Query results (no orderBy):', results.length, 'dealers');
        return results;
      }
    }
    
    // Fallback: get all dealers and filter in memory
    console.log('Fallback: filtering all dealers in memory');
    const allDealers = await getDealers();
    
    let filteredDealers = allDealers;
    
    // Apply status filter
    if (status === 'blank' || status === 'pending') {
      filteredDealers = filteredDealers.filter(dealer => 
        !dealer.status || dealer.status === '' || dealer.status === null
      );
    } else if (status) {
      filteredDealers = filteredDealers.filter(dealer => dealer.status === status);
    }
    
    // Apply city filter
    if (city) {
      filteredDealers = filteredDealers.filter(dealer => dealer.city === city);
    }
    
    console.log('Memory filtered results:', filteredDealers.length, 'dealers');
    return filteredDealers;
    
  } catch (error) {
    console.error("Error getting filtered dealers: ", error);
    // If all else fails, return all dealers
    const allDealers = await getDealers();
    console.log('Error fallback: returning all dealers');
    return allDealers;
  }
};

/**
 * Get dealers with blank status
 * @returns {Promise<Array>} Array of dealer objects
 */
export const getDealersWithBlankStatus = async () => {
  try {
    console.log("Getting dealers with blank status...");
    
    // Try with composite index first
    try {
      const q = query(
        collection(db, "dealers"), 
        where("status", "==", ""),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null,
        updatedAt: doc.data().updatedAt ? doc.data().updatedAt.toDate() : null
      }));
      
      console.log(`Found ${results.length} dealers with blank status (indexed query)`);
      return results;
    } catch (indexError) {
      console.log("Error using composite index, trying query without orderBy:", indexError);
      
      // Try without orderBy
      const q2 = query(
        collection(db, "dealers"), 
        where("status", "==", "")
      );
      const querySnapshot = await getDocs(q2);
      let results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null,
        updatedAt: doc.data().updatedAt ? doc.data().updatedAt.toDate() : null
      }));
      
      // Sort in memory
      results.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt - a.createdAt;
      });
      
      console.log(`Found ${results.length} dealers with blank status (non-indexed query)`);
      return results;
    }
  } catch (error) {
    console.error("Error getting dealers with blank status, trying fallback method:", error);
    
    // Fallback to filtering all dealers in memory
    try {
      const allDealers = await getDealers();
      const pendingDealers = allDealers.filter(dealer => 
        !dealer.status || dealer.status === '' || dealer.status === null
      );
      
      // Sort by created date descending
      pendingDealers.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt - a.createdAt;
      });
      
      console.log(`Found ${pendingDealers.length} dealers with blank status (memory filter fallback)`);
      return pendingDealers;
    } catch (fallbackError) {
      console.error("Even fallback method failed:", fallbackError);
      return [];
    }
  }
};

/**
 * Update dealer status
 * @param {string} dealerId - Dealer ID
 * @param {string} status - New status value
 * @returns {Promise<Object>} Success indicator or error
 */
export const updateDealerStatus = async (dealerId, status) => {
  try {
    const dealerRef = doc(db, "dealers", dealerId);
    await updateDoc(dealerRef, {
      status: status,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating dealer status: ", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update dealer information
 * @param {string} dealerId - Dealer ID
 * @param {Object} data - Updated dealer data
 * @returns {Promise<Object>} Success indicator or error
 */
export const updateDealer = async (dealerId, data) => {
  try {
    const dealerRef = doc(db, "dealers", dealerId);
    
    // Ensure status is consistently stored as empty string if not provided
    const updatedData = {
      ...data,
      status: data.status || '', // Convert null/undefined to empty string
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(dealerRef, updatedData);
    return { success: true };
  } catch (error) {
    console.error("Error updating dealer: ", error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a dealer
 * @param {string} dealerId - Dealer ID to delete
 * @returns {Promise<Object>} Success indicator or error
 */
export const deleteDealer = async (dealerId) => {
  try {
    const dealerRef = doc(db, "dealers", dealerId);
    await deleteDoc(dealerRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting dealer: ", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get statistics for dashboard
 * @returns {Promise<Object>} Statistics object
 */
export const getDealerStats = async () => {
  try {
    const allDealers = await getDealers();
    
    // Calculate statistics
    const totalDealers = allDealers.length;
    const verified = allDealers.filter(dealer => dealer.status === 'verified').length;
    const unverified = allDealers.filter(dealer => dealer.status === 'unverified').length;
    const pending = allDealers.filter(dealer => !dealer.status || dealer.status === '').length;
    
    // Get unique cities
    const uniqueCities = [...new Set(allDealers.map(dealer => dealer.city))].length;
    
    // Calculate recent additions (in the last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentAdditions = allDealers.filter(dealer => 
      dealer.createdAt && dealer.createdAt > oneWeekAgo
    ).length;
    
    return {
      totalDealers,
      verified,
      unverified,
      pending,
      uniqueCities,
      recentAdditions
    };
  } catch (error) {
    console.error("Error getting dealer stats: ", error);
    return {
      totalDealers: 0,
      verified: 0,
      unverified: 0,
      pending: 0,
      uniqueCities: 0,
      recentAdditions: 0
    };
  }
};

/**
 * Get data for CSV export
 * @returns {Promise<Array>} Array of dealer objects formatted for export
 */
export const getExportData = async () => {
  try {
    const dealers = await getDealers();
    
    // Format data for export
    return dealers.map(dealer => ({
      Name: dealer.name || '',
      City: dealer.city || '',
      'Contact Number': dealer.contactNumber || '',
      'Alternate Number': dealer.alternateNumber || '',
      Status: dealer.status || 'Pending',
      'Added On': dealer.createdAt ? dealer.createdAt.toLocaleDateString() : '',
      'Last Updated': dealer.updatedAt ? dealer.updatedAt.toLocaleDateString() : ''
    }));
  } catch (error) {
    console.error("Error preparing export data: ", error);
    return [];
  }
};