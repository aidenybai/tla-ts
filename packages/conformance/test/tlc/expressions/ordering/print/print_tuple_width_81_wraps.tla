(*---
description: "An 81 column tuple is past the limit of 80 and wraps."
ref: "tlc2/pprint/PrettyPrint.java#mypp"
flags: [expression]
outcome: success
---*)
---- MODULE print_tuple_width_81_wraps ----
EXTENDS Integers, TLC
Test == PrintT([i \in 1..22 |-> i])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | << 1,
    |    2,
    |    3,
    |    4,
    |    5,
    |    6,
    |    7,
    |    8,
    |    9,
    |    10,
    |    11,
    |    12,
    |    13,
    |    14,
    |    15,
    |    16,
    |    17,
    |    18,
    |    19,
    |    20,
    |    21,
    |    22 >>
---*)
