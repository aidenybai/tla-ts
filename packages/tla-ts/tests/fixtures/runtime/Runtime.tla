------------------------------ MODULE Runtime ------------------------------
EXTENDS Naturals, TLC

VARIABLE x

Init == x \in {0, 1} /\ TLCSet(1, 0)

Next == /\ x < 6
        /\ TLCSet(1, TLCGet(1) + 1)
        /\ x' \in {x + 1, x + 2}

LevelMatches == TLCGet("level") <= x + 1

Counted == TLCGet("distinct") <= TLCGet("generated")

Bounded == TLCGet("level") < 5

Diameter == TLCGet("diameter") <= TLCGet("level") + 1

Registers == TLCGet("all")[1][1] = TLCGet(1)

FewDistinct == TLCGet("distinct") < 6

FewGenerated == TLCGet("generated") < 7 \/ TLCGet("queue") > 2
=============================================================================
