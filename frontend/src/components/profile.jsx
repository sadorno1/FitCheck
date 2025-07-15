import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [posts, setPosts] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();
  const location = useLocation(); // ✅ this must be inside the component

  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  useEffect(() => {
    const fetchUserDataAndPosts = async () => {
      const user = auth.currentUser;
      if (!user) return navigate('/login');

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setUserData(data);

        if (data.avatarPath) {
          const url = await getDownloadURL(ref(storage, data.avatarPath));
          setAvatarUrl(url);
        }
      }

      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(postsQuery);
      const userPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(userPosts);
    };

    fetchUserDataAndPosts();
  }, []);

  useEffect(() => {
    if (location.state?.fromPostSuccess) {
      setSuccessMessage("✅ Posted successfully! Check your feed below.");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  }, [location]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleEditPreferences = () => {
    navigate('/quiz');
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex flex-col items-center space-y-4">
        <img
          src={avatarUrl || '/placeholder-avatar.png'}
          alt="Avatar"
          className="w-24 h-24 rounded-full object-cover"
        />
        <h2 className="text-2xl font-bold">
          {userData?.username || 'Username'}
        </h2>
        <p className="text-center text-gray-600">
          {userData?.bio || 'No bio available.'}
        </p>

        <div className="flex gap-4">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={handleEditPreferences}
          >
            Preferences
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4 text-center mt-6">
          {successMessage}
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">My Posts</h3>
        {posts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {posts.map((post, idx) => (
              <div key={post.id} className="rounded shadow">
                <img
                  src={post.imageUrl}
                  alt={`Post ${idx + 1}`}
                  className="w-full h-auto rounded"
                />
                <p className="text-sm mt-1 px-1 text-gray-700">{post.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No posts uploaded yet.</p>
        )}
      </div>
    </div>
  );
}
