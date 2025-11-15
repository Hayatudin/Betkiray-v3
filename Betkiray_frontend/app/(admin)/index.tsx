// app/(admin)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import api from "@/config/api";
import { useUser } from "@/contexts/UserContext";

export default function AdminDashboardScreen() {
  const { user } = useUser();
  const [stats, setStats] = useState({
    totalProperties: 248,
    pendingApprovals: 15,
    totalUsers: 1200,
    monthlyEarnings: 5200,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch stats from backend
    const fetchStats = async () => {
      try {
        // You can replace these with actual API calls
        // const response = await api.get('/admin/stats');
        // setStats(response.data);
        setStats({
          totalProperties: 248,
          pendingApprovals: 15,
          totalUsers: 1200,
          monthlyEarnings: 5200,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return <ActivityIndicator style={styles.centered} size="large" />;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header with Welcome and Avatar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>
            Welcome, {user?.name?.split(" ")[0] || "Admin"}!
          </Text>
          <Text style={styles.subtitleText}>Manage the properties</Text>
        </View>
        <TouchableOpacity style={styles.notificationIcon}>
          <Ionicons name="notifications" size={24} color="#333" />
        </TouchableOpacity>
        {user?.image ? (
          <Image source={{ uri: user.image }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0) || "A"}
            </Text>
          </View>
        )}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        {/* Total Properties */}
        <View style={[styles.statCard, styles.greenBg]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="home" size={32} color="#fff" />
          </View>
          <Text style={styles.statPercentage}>+12%</Text>
          <Text style={styles.statNumber}>{stats.totalProperties}</Text>
          <Text style={styles.statLabel}>Total Properties</Text>
        </View>

        {/* Pending Approvals */}
        <View style={[styles.statCard, styles.blueBg]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="checkmark-circle" size={32} color="#fff" />
          </View>
          <Text style={styles.statPercentage}>+5</Text>
          <Text style={styles.statNumber}>{stats.pendingApprovals}</Text>
          <Text style={styles.statLabel}>Pending Approvals</Text>
        </View>

        {/* Total Users */}
        <View style={[styles.statCard, styles.grayscaleBg]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="people" size={32} color="#fff" />
          </View>
          <Text style={styles.statPercentage}>+18%</Text>
          <Text style={styles.statNumber}>
            {(stats.totalUsers / 1000).toFixed(1)}K
          </Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>

        {/* Monthly Earnings */}
        <View style={[styles.statCard, styles.orangeBg]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="wallet" size={32} color="#fff" />
          </View>
          <Text style={styles.statPercentage}>+8%</Text>
          <Text style={styles.statNumber}>
            ${(stats.monthlyEarnings / 1000).toFixed(1)}K
          </Text>
          <Text style={styles.statLabel}>Monthly Earnings</Text>
        </View>
      </View>

      {/* Analytics Section */}
      <View style={styles.analyticsSection}>
        <Text style={styles.analyticsTitleText}>Analytics</Text>
        <View style={styles.analyticsCard}>
          <Text style={styles.chartTitle}>Property Categories</Text>
          <View style={styles.chartContainer}>
            <View style={styles.donutChart}>
              {/* Simplified donut chart representation */}
              <View style={styles.chartPlaceholder}>
                <Ionicons name="pie-chart" size={60} color="#ddd" />
              </View>
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: "#3498db" }]}
                />
                <Text style={styles.legendText}>Apartments</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: "#27ae60" }]}
                />
                <Text style={styles.legendText}>Houses</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: "#f39c12" }]}
                />
                <Text style={styles.legendText}>Office</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  subtitleText: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
  notificationIcon: {
    padding: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e0e0e0",
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  statsGrid: {
    display: "flex",
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: "space-between",
    minHeight: 140,
  },
  greenBg: {
    backgroundColor: "#d4edda",
  },
  blueBg: {
    backgroundColor: "#d1ecf1",
  },
  grayscaleBg: {
    backgroundColor: "#e8e8e8",
  },
  orangeBg: {
    backgroundColor: "#ffe5cc",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2d4f4e",
    justifyContent: "center",
    alignItems: "center",
  },
  statPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginTop: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  analyticsSection: {
    marginBottom: 24,
  },
  analyticsTitleText: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#000",
  },
  analyticsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000",
  },
  chartContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  donutChart: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  chartPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
});
