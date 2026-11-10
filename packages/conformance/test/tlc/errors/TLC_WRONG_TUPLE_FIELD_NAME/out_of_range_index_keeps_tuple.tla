(*---
description: "An integer out of range is not this warning. It is TLC_EXCEPT_APPLIED_TO_UNKNOWN_FIELD, and the tuple stays as it was."
ref: tlc2/value/impl/TupleValue.java#takeExcept
outcome: success
config: ""
---*)
---- MODULE out_of_range_index_keeps_tuple ----
EXTENDS TLC
ASSUME PrintT([<<1, 2>> EXCEPT ![9] = 3])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 9, col 16 to line 9, col 23 of module out_of_range_index_keeps_tuple
    | <<1, 2>>
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
