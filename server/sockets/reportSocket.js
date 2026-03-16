const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Citizen joins room with their anonId to receive status updates
    socket.on('joinReport', (anonId) => {
      if (anonId) {
        socket.join(anonId);
        console.log(`📡 Socket ${socket.id} joined report room: ${anonId}`);
      }
    });

    // Admin joins admin room to receive new report notifications
    socket.on('joinAdmin', () => {
      socket.join('admin-room');
      console.log(`👮 Socket ${socket.id} joined admin room`);
    });

    // Admin leaves admin room on logout
    socket.on('leaveAdmin', () => {
      socket.leave('admin-room');
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupSocket;
