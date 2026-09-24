import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";

export default function NotFound() {
  return (
    <EmptyState
      title="This page is off the setlist"
      description="We couldn’t find the MusicMedia page you requested. Return home to explore music distribution, publishing, and marketing tools."
      action={
        <Button href="/" variant="primary">
          Back to MusicMedia
        </Button>
      }
    />
  );
}