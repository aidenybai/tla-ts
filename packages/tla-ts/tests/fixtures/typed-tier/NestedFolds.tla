---- MODULE NestedFolds ----
EXTENDS Naturals, FiniteSets
CONSTANTS Keys
VARIABLES writes
ReduceSet(op(_, _), set, base) ==
  LET iter[s \in SUBSET set] ==
        IF s = {} THEN base
        ELSE LET x == CHOOSE x \in s : TRUE
             IN op(x, iter[s \ {x}])
  IN iter[set]
Intersection(sets) == ReduceSet(\cap, sets, UNION sets)
Apply(state, batch) ==
  ReduceSet(LAMBDA write, acc : [acc EXCEPT ![write.key] = write.value], batch, state)
Final == ReduceSet(LAMBDA batch, acc : Apply(acc, batch), writes, [k \in Keys |-> 0])
Init == writes = {}
Next ==
  \E k, other \in Keys, v \in 1..2 :
    /\ Cardinality(writes) < 3
    /\ writes' = writes \cup {{[key |-> k, value |-> v], [key |-> other, value |-> 1]}}
Bounded == \A k \in Keys : Final[k] \in 0..2
Shared == Intersection({Keys} \cup {{write.key : write \in batch} : batch \in writes}) \subseteq Keys
====
