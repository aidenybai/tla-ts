------------------------------- MODULE Pick --------------------------------
EXTENDS Naturals, TLCExt

VARIABLE x

Init == x = 0

Next == x' = (x + 1) % 3

\* TLC asks to pick a successor only for an unseen state that fails the
\* condition, and x' = 0 always returns to the initial state.
Seen == PickSuccessor(x' # 0)

\* PickSuccessor needs a complete successor state.
Incomplete == PickSuccessor(TRUE)
=============================================================================
