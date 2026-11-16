(*---
description: "A tuple wider than 80 columns breaks at every comma, one component per line."
ref: "tlc2/value/Values.java#ppr"
flags: [expression]
outcome: success
---*)
---- MODULE print_wraps_long_tuple ----
EXTENDS Integers, TLC
Test == PrintT([i \in 1..40 |-> i])
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
    |    22,
    |    23,
    |    24,
    |    25,
    |    26,
    |    27,
    |    28,
    |    29,
    |    30,
    |    31,
    |    32,
    |    33,
    |    34,
    |    35,
    |    36,
    |    37,
    |    38,
    |    39,
    |    40 >>
---*)
