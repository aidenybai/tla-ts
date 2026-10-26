------------------------------- MODULE Defer -------------------------------
EXTENDS Naturals, TLC, TLCExt

VARIABLE x

Init == x = 0

\* TLC evaluates the argument of TLCDefer only in simulation mode, so
\* breadth-first search neither prints nor fails here.
Next == /\ x < 2
        /\ TLCDefer(PrintT(x) /\ 1 \div 0 = 0)
        /\ x' = x + 1
=============================================================================
