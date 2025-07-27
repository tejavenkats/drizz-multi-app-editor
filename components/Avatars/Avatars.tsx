import { useOthers, useSelf } from "@liveblocks/react/suspense";
import styles from "./avatars.module.css";

export function Avatars() {
  const users = useOthers();
  const currentUser = useSelf();

  return (
    <div className={`${styles.avatars}`}>
      {users.map(({ connectionId, info }, index) => {
        return (
          <Avatar key={connectionId} color={info.color} name={info.name} position={index} />
        );
      })}

      {currentUser && (
        <div className="relative ml-2 first:ml-0">
          <Avatar name={currentUser.info.name} color={currentUser.info.color} />
        </div>
      )}
    </div>
  );
}

export function Avatar({ color, name, position }: { color: string; name: string; position?: number }) {
  return (
    <div className={`${styles.avatar} flex items-center justify-center`} style={{ backgroundColor: color }} data-tooltip={name}>
      <div className={styles.avatar_color} style={{ backgroundColor: color }} />
      <span className={styles.avatar_name}>{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}
