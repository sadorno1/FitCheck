import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import "./style.css";

export default function UserProfile() {
  const [userData, setUserData] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return navigate('/login');

      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);

        if (data.avatarPath) {
          const url = await getDownloadURL(ref(storage, data.avatarPath));
          setAvatarUrl(url);
        }

        if (data.posts) {
          setPosts(data.posts);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleEditPreferences = () => {
    navigate('/quiz'); // Route to quiz/preferences
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex flex-col items-center space-y-4">
        <img
          src={avatarUrl || '/placeholder-avatar.png'}
          alt="Avatar"
          className="w-24 h-24 rounded-full object-cover"
        />
        <h2 className="text-2xl font-bold">{userData?.username || 'Username'}</h2>
        <p className="text-center text-gray-600">{userData?.bio || 'No bio available.'}</p>

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

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">My Posts</h3>
        {posts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {posts.map((post, idx) => (
              <img
                key={idx}
                src={post.imageUrl}
                alt={`Post ${idx + 1}`}
                className="rounded shadow"
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No posts uploaded yet.</p>
        )}
      </div>
    </div>
  );
}
