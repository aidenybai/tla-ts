(*---
description: "An unknown string field is not this warning. It is TLC_EXCEPT_APPLIED_TO_UNKNOWN_FIELD, and the record stays as it was."
ref: tlc2/value/impl/RecordValue.java#takeExcept
outcome: success
config: ""
---*)
---- MODULE unknown_string_field_keeps_record ----
EXTENDS TLC
ASSUME PrintT([[a |-> 1] EXCEPT !.b = 2])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 9, col 16 to line 9, col 24 of module unknown_string_field_keeps_record
    | [a |-> 1]
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
