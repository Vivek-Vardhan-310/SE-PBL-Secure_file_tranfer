const users = {
  "user1": {
    privateKey: "key1",
    files: [
      {name: "file1.txt", type: "private", downloaderId: "user2"},
      {name: "file2.pdf", type: "public"}
    ]
  },
  "user2": {
    privateKey: "key2",
    files: [
      {name: "doc1.docx", type: "private", downloaderId: "user1"},
      {name: "image.jpg", type: "public"}
    ]
  },
  "user3": {
    privateKey: "key3",
    files: [
      {name: "report.xlsx", type: "private", downloaderId: "user1"}
    ]
  }
};
