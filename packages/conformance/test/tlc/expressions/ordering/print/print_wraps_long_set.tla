(*---
description: "A long set wraps one element per line, indented past the brace."
ref: "tlc2/pprint/PrettyPrint.java#mypp"
flags: [expression]
outcome: success
---*)
---- MODULE print_wraps_long_set ----
EXTENDS Integers, TLC
Test == PrintT({i * 1000 : i \in 1..30})
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { 1000,
    |   2000,
    |   3000,
    |   4000,
    |   5000,
    |   6000,
    |   7000,
    |   8000,
    |   9000,
    |   10000,
    |   11000,
    |   12000,
    |   13000,
    |   14000,
    |   15000,
    |   16000,
    |   17000,
    |   18000,
    |   19000,
    |   20000,
    |   21000,
    |   22000,
    |   23000,
    |   24000,
    |   25000,
    |   26000,
    |   27000,
    |   28000,
    |   29000,
    |   30000 }
---*)
