------------------------------ MODULE Labels ------------------------------
EXTENDS Naturals, Sequences

VARIABLES v, s

I == INSTANCE Bump

Init == v = 0 /\ s = <<>>

Push(c) == Len(s) < 2 /\ s' = Append(s, c) /\ UNCHANGED v

Next == \/ v < 2 /\ I!Bump /\ UNCHANGED s
        \/ \E c \in {"a\"b", "c\\d"} : Push(c)
        \/ s # <<>> /\ s' = <<>> /\ v' = v

Alias == [vee |-> v, len |-> Len(s), seq |-> s]
=============================================================================
