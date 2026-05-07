import { useEffect, useState } from "react";
import {
  Card, Button, Checkbox, Typography, message, Spin, Table, Tag, Space, Divider
} from "antd";
import { SaveOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { getAdminPermissions, updateAdminPermissions } from "../../../services/api";

const { Title, Text } = Typography;

// Nhóm permissions theo module
const PERMISSION_GROUPS = [
  {
    group: "Tour",
    color: "blue",
    keys: ["tours_view", "tours_create", "tours_edit", "tours_delete"],
  },
  {
    group: "Danh mục",
    color: "green",
    keys: ["categories_view", "categories_create", "categories_edit", "categories_delete"],
  },
  {
    group: "Tài khoản",
    color: "purple",
    keys: ["accounts_view", "accounts_create", "accounts_edit", "accounts_delete"],
  },
  {
    group: "Vai trò",
    color: "orange",
    keys: ["roles_view", "roles_create", "roles_edit", "roles_delete", "roles_permissions"],
  },
  {
    group: "Đơn hàng",
    color: "red",
    keys: ["orders_view", "orders_edit", "orders_delete"],
  },
];

function AdminPermissions() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  // permMap: { roleId: Set<permKey> }
  const [permMap, setPermMap] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAdminPermissions();
      const { roles: roleList, allPermissions: perms } = res.data;
      setRoles(roleList);
      setAllPermissions(perms);

      // Khởi tạo map
      const map = {};
      for (const r of roleList) {
        map[r.id] = new Set(r.permissions || []);
      }
      setPermMap(map);
    } catch {
      message.error("Không thể tải dữ liệu phân quyền");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const togglePermission = (roleId, permKey) => {
    setPermMap((prev) => {
      const newMap = { ...prev };
      const set = new Set(newMap[roleId]);
      if (set.has(permKey)) {
        set.delete(permKey);
      } else {
        set.add(permKey);
      }
      newMap[roleId] = set;
      return newMap;
    });
  };

  const toggleGroupForRole = (roleId, keys, checked) => {
    setPermMap((prev) => {
      const newMap = { ...prev };
      const set = new Set(newMap[roleId]);
      for (const k of keys) {
        if (checked) set.add(k);
        else set.delete(k);
      }
      newMap[roleId] = set;
      return newMap;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const permissions = Object.entries(permMap).map(([roleId, set]) => ({
        roleId: parseInt(roleId),
        permissions: Array.from(set),
      }));
      await updateAdminPermissions({ permissions });
      message.success("Lưu phân quyền thành công!");
    } catch {
      message.error("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <SafetyCertificateOutlined style={{ color: "#00b96b", marginRight: 8 }} />
            Phân quyền hệ thống
          </Title>
          <Text type="secondary">Tích chọn quyền cho từng vai trò</Text>
        </div>
        <Button
          type="primary" icon={<SaveOutlined />} size="large"
          loading={saving} onClick={handleSave}
        >
          Lưu phân quyền
        </Button>
      </div>

      {PERMISSION_GROUPS.map((group) => {
        const groupPerms = allPermissions.filter((p) => group.keys.includes(p.key));

        return (
          <Card
            key={group.group}
            title={<Tag color={group.color} style={{ fontSize: 14, padding: "4px 10px" }}>{group.group}</Tag>}
            style={{ marginBottom: 16 }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fafafa" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", width: 220, borderBottom: "1px solid #f0f0f0" }}>
                      Quyền
                    </th>
                    {roles.map((role) => (
                      <th key={role.id} style={{ padding: "12px 16px", textAlign: "center", borderBottom: "1px solid #f0f0f0", minWidth: 140 }}>
                        <div style={{ fontWeight: 600 }}>{role.title}</div>
                        <div style={{ marginTop: 4 }}>
                          <Checkbox
                            indeterminate={
                              group.keys.some((k) => permMap[role.id]?.has(k)) &&
                              !group.keys.every((k) => permMap[role.id]?.has(k))
                            }
                            checked={group.keys.every((k) => permMap[role.id]?.has(k))}
                            onChange={(e) => toggleGroupForRole(role.id, group.keys, e.target.checked)}
                          >
                            <Text type="secondary" style={{ fontSize: 11 }}>Tất cả</Text>
                          </Checkbox>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groupPerms.map((perm, idx) => (
                    <tr
                      key={perm.key}
                      style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa" }}
                    >
                      <td style={{ padding: "10px 16px", borderBottom: "1px solid #f0f0f0" }}>
                        <Text style={{ fontSize: 13 }}>{perm.label}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>{perm.key}</Text>
                      </td>
                      {roles.map((role) => (
                        <td key={role.id} style={{ padding: "10px 16px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                          <Checkbox
                            checked={permMap[role.id]?.has(perm.key) || false}
                            onChange={() => togglePermission(role.id, perm.key)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}

      <div style={{ textAlign: "right", marginTop: 16 }}>
        <Button
          type="primary" icon={<SaveOutlined />} size="large"
          loading={saving} onClick={handleSave}
        >
          Lưu phân quyền
        </Button>
      </div>
    </div>
  );
}

export default AdminPermissions;
