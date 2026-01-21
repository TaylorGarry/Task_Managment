import React from "react";
import {
  Dialog,
  DialogContent,
  Button,
  Typography,
  Box,
  IconButton
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

export default function DialogBox({ open, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "visible"
        }
      }}
    >
      {/* Close Button */}
      <IconButton
        onClick={onClose}
        sx={{
          position: "absolute",
          top: -12,
          right: -12,
          backgroundColor: "white",
          boxShadow: 2,
          "&:hover": { backgroundColor: "#f5f5f5" }
        }}
      >
        <CloseIcon />
      </IconButton>

      {/* Header */}
      <Box
        sx={{
          backgroundColor: "#4e84cc",
          textAlign: "center",
          pt: 5,
          pb: 4,
          color: "white",
          position: "relative"
        }}
      >
        {/* Success Icon */}
        <Box
          sx={{
            width: 70,
            height: 70,
            borderRadius: "50%",
            backgroundColor: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2
          }}
        >
          <CheckIcon sx={{ fontSize: 40, color: "#056b05" }} />
        </Box>

        <Typography variant="h5" fontWeight="bold">
          Awesome!
        </Typography>

        <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
          User updated successfully
        </Typography>

        {/* Pointer */}
        <Box
          sx={{
            position: "absolute",
            bottom: -12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "12px solid transparent",
            borderRight: "12px solid transparent",
            borderTop: "12px solid #4e84cc"
          }}
        />
      </Box>

      {/* Footer */}
      <DialogContent sx={{ textAlign: "center", py: 4 }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            backgroundColor: "#4e84cc",
            px: 4,
            py: 1.2,
            fontWeight: "bold",
            borderRadius: 2,
            boxShadow: 2,
            "&:hover": {
              backgroundColor: "#4274b4"
            }
          }}
        >
          OK
        </Button>
      </DialogContent>
    </Dialog>
  );
}
