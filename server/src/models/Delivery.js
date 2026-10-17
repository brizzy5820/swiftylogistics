import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Null for guest bookings
      default: null,
    },

    isGuestOrder: {
      type: Boolean,
      default: false,
    },

    guestInfo: {
      guestId: { type: String },
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
    },

    guestEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },

    guestPhone: {
      type: String,
      trim: true,
      default: null,
    },

    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    riderName: {
      type: String,
      trim: true,
      default: null,
    },

    type: {
      type: String,
      enum: ['delivery', 'ride'],
      default: 'delivery',
    },

    pickup: {
      address: {
        type: String,
        required: true,
        trim: true,
      },
      coords: {
        lat: { type: Number },
        lng: { type: Number },
      },
      lat: { type: Number },
      lng: { type: Number },
      contactName: { type: String, trim: true },
      contactPhone: { type: String, trim: true },
    },

    dropoff: {
      address: {
        type: String,
        required: true,
        trim: true,
      },
      coords: {
        lat: { type: Number },
        lng: { type: Number },
      },
      lat: { type: Number },
      lng: { type: Number },
      recipientName: { type: String, trim: true },
      recipientPhone: { type: String, trim: true },
    },

    packageType: {
      type: String,
      enum: ['Express', 'Cargo', 'Electric', 'Standard'],
      default: 'Express',
    },

    weightKg: {
      type: Number,
      min: 0,
      default: 1,
    },

    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    rideType: {
      type: String,
      trim: true,
      default: null,
    },

    paymentMethod: {
      type: String,
      trim: true,
      default: 'cash',
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    fare: {
      type: Number,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },

    distanceKm: {
      type: Number,
      min: 0,
    },

    etaMinutes: {
      type: Number,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        'scheduled',
        'pending',
        'accepted',
        'arrived_at_pickup',
        'picked_up',
        'in_transit',
        'arrived_at_dropoff',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
    },

    deliveryPin: {
      type: String,
      select: false,
    },

    trackingId: {
      type: String,
      unique: true,
      required: true,
    },

    courierPosition: {
      lat: Number,
      lng: Number,
    },

    statusTimestamps: {
      type: Map,
      of: Date,
      default: {},
    },

    timeline: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],

    scheduledFor: {
      type: Date,
      default: null,
    },

    isScheduled: {
      type: Boolean,
      default: false,
    },

    customerConfirmed: {
      type: Boolean,
      default: false,
    },

    messages: {
      type: [
        {
          sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          senderRole: { type: String, enum: ['customer', 'rider'], required: true },
          text: { type: String, trim: true, maxlength: 1000, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure coords and lat/lng and fare/price compatibility
// NOTE: Mongoose 9 uses promise-based middleware — no `next` callback.
deliverySchema.pre('save', function () {
  if (this.price !== undefined && (this.fare === undefined || this.fare === null)) {
    this.fare = this.price;
  } else if (this.fare !== undefined && (this.price === undefined || this.price === null)) {
    this.price = this.fare;
  }

  if (this.pickup) {
    if (this.pickup.coords && (this.pickup.lat === undefined || this.pickup.lat === null)) {
      this.pickup.lat = this.pickup.coords.lat;
      this.pickup.lng = this.pickup.coords.lng;
    } else if (this.pickup.lat !== undefined && !this.pickup.coords) {
      this.pickup.coords = { lat: this.pickup.lat, lng: this.pickup.lng };
    }
  }

  if (this.dropoff) {
    if (this.dropoff.coords && (this.dropoff.lat === undefined || this.dropoff.lat === null)) {
      this.dropoff.lat = this.dropoff.coords.lat;
      this.dropoff.lng = this.dropoff.coords.lng;
    } else if (this.dropoff.lat !== undefined && !this.dropoff.coords) {
      this.dropoff.coords = { lat: this.dropoff.lat, lng: this.dropoff.lng };
    }
  }

  if (this.guestEmail && !this.guestInfo?.email) {
    if (!this.guestInfo) this.guestInfo = {};
    this.guestInfo.email = this.guestEmail;
  }
  if (this.guestPhone && !this.guestInfo?.phone) {
    if (!this.guestInfo) this.guestInfo = {};
    this.guestInfo.phone = this.guestPhone;
  }
});

// Virtual helper to always return a normalized customer profile for the driver
deliverySchema.virtual('customerProfile').get(function () {
  if (this.customer && typeof this.customer === 'object' && this.customer.name) {
    return {
      id: this.customer._id || this.customer.id,
      name: this.customer.name,
      phone: this.customer.phone || this.pickup?.contactPhone,
      email: this.customer.email,
      avatar: this.customer.avatar,
      isGuest: false,
    };
  }
  return {
    id: this.guestInfo?.guestId || 'guest',
    name: this.guestInfo?.name || this.pickup?.contactName || 'Guest Customer',
    phone: this.guestInfo?.phone || this.guestPhone || this.pickup?.contactPhone || 'N/A',
    email: this.guestInfo?.email || this.guestEmail || '',
    avatar: null,
    isGuest: true,
  };
});

deliverySchema.set('toJSON', { virtuals: true });
deliverySchema.set('toObject', { virtuals: true });

// Hot query path indexes
deliverySchema.index({ customer: 1, createdAt: -1 });
deliverySchema.index({ rider: 1, status: 1, createdAt: -1 });
deliverySchema.index({ status: 1, scheduledFor: 1 });
deliverySchema.index({ status: 1, createdAt: -1 });
deliverySchema.index({ 'guestInfo.guestId': 1 });
deliverySchema.index({ guestEmail: 1 });
deliverySchema.index({ guestPhone: 1 });

const Delivery = mongoose.model('Delivery', deliverySchema);

export default Delivery;