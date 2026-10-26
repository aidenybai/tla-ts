-------------------------- MODULE ParameterizedSpec --------------------------
EXTENDS Naturals

VARIABLE count

C(bound) == INSTANCE Counting WITH Limit <- bound, value <- count

Spec == C(3)!Spec

ReachesLimit == <>(count = 3)

Small == count < 3
=============================================================================
