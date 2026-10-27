---------------------------- MODULE ReplicatedLog ----------------------------
(* A log replicated across servers, inspired by the consensus spec in       *)
(* microsoft/CCF. The leader appends values. Followers copy a prefix of     *)
(* what they're missing. Ported from tlaplus/Examples FiniteMonotonic.      *)
EXTENDS Sequences, Integers, FiniteSets

CONSTANT Lag, Servers, Values
ASSUME Lag \in Nat /\ IsFiniteSet(Servers) /\ Cardinality(Servers) > 1

VARIABLE cLogs
vars == <<cLogs>>

Max(S) == CHOOSE x \in S : \A y \in S : y <= x
Min(S) == CHOOSE x \in S : \A y \in S : x <= y
BoundedSeq(S, n) == UNION {[1..m -> S] : m \in 0..n}
IsStrictPrefix(s, t) == Len(s) < Len(t) /\ SubSeq(t, 1, Len(s)) = s

TypeOK == cLogs \in [Servers -> Seq(Values)]

Init == cLogs \in [Servers -> {<< >>}]

Copy(i) ==
    \E j \in Servers :
        /\ Len(cLogs[j]) > Len(cLogs[i])
        /\ LET L == Len(cLogs[j]) - Len(cLogs[i])
           IN  \E l \in L - 1 .. L :
                   cLogs' = [cLogs EXCEPT ![i] = @ \o SubSeq(cLogs[j], Len(@) + 1, Len(@) + l)]

Extend(i) ==
    /\ \A j \in Servers : Len(cLogs[j]) <= Len(cLogs[i])
    /\ \E s \in BoundedSeq(Values, Lag - Max({Len(cLogs[i]) - Len(cLogs[j]) : j \in Servers})) :
           cLogs' = [cLogs EXCEPT ![i] = @ \o s]

Next == \E i \in Servers : Copy(i) \/ Extend(i)

Spec ==
    /\ Init
    /\ [][Next]_vars
    /\ \A s \in Servers : WF_vars(Extend(s)) /\ WF_vars(Copy(s))

BoundedLag ==
    \A i, j \in Servers : Len(cLogs[i]) - Len(cLogs[j]) <= Lag

AllExtending ==
    \A s \in Servers : []<><<IsStrictPrefix(cLogs[s], cLogs'[s])>>_cLogs

\* Followers may copy only part of what they're missing, so the logs never
\* have to agree.
InSync == \A i, j \in Servers : []<>(cLogs[i] = cLogs[j])

\* Drops the prefix every log shares, which keeps the state space finite.
DropCommonPrefix ==
    LET shared == Min({Len(cLogs[s]) : s \in Servers})
    IN  [s \in Servers |-> SubSeq(cLogs[s], shared + 1, Len(cLogs[s]))]
==============================================================================
