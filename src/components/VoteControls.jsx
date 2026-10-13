function VoteControls({
  upVotesBy = [],
  downVotesBy = [],
  userId,
  disabled,
  onVote,
}) {
  const hasUpvoted = Boolean(
    userId && upVotesBy.some((id) => String(id) === String(userId)),
  );

  const hasDownvoted = Boolean(
    userId && downVotesBy.some((id) => String(id) === String(userId)),
  );

  return (
    <div className="vote-controls" aria-label="Voting">
      <button
        type="button"
        className={hasUpvoted ? 'vote-button active' : 'vote-button'}
        aria-pressed={hasUpvoted}
        disabled={disabled}
        onClick={() => onVote('up-vote')}
      >
        ▲
        {' '}
        {upVotesBy.length}
      </button>

      <button
        type="button"
        className={hasDownvoted ? 'vote-button active' : 'vote-button'}
        aria-pressed={hasDownvoted}
        disabled={disabled}
        onClick={() => onVote('down-vote')}
      >
        ▼
        {' '}
        {downVotesBy.length}
      </button>

      <button
        type="button"
        className="vote-button"
        disabled={disabled || (!hasUpvoted && !hasDownvoted)}
        onClick={() => onVote('neutral-vote')}
      >
        Netral
      </button>
    </div>
  );
}

export default VoteControls;
