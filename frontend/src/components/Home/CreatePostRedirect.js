import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CreatePostRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home with a query parameter to open create post modal
    navigate('/?openCreatePost=true', { replace: true });
  }, [navigate]);

  return null; // This component doesn't render anything
};

export default CreatePostRedirect;
