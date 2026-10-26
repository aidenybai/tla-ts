---------------------------- MODULE TraceAssume ----------------------------
EXTENDS Sequences, TLCExt

VARIABLES x, y

\* An assumption has no state, so Trace cannot be evaluated.
ASSUME Trace = <<>>

Init == x = 0 /\ y = 0

Next == UNCHANGED <<x, y>>
=============================================================================
