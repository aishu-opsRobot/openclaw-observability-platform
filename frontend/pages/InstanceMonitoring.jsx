import intl from "react-intl-universal";

export default function InstanceMonitoring() {
  return (
    <div className="space-y-6">
      <section className="app-card p-6">
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {intl.get("page.instanceMonitoring.placeholder")}
        </p>
      </section>
    </div>
  );
}
