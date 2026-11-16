(*---
description: Evaluates a random set expression, seed 262, number 9915.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09915 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {(<<>> .. <<1, 2>>), {<<5, 6>> : b15422 \in 2..1}} \ ((2147483647 .. 2) \cup ({1} \ {2, 1, 3}))) \cap ({b15423 \in (<<>> .. 0) : (\A b15424 \in {x \in 1..3 : x > 1} : TRUE)} \cup ((--1) .. [<<1, 2>> EXCEPT ![1] = 1]))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 207 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 204.
    | Expression starting at line 14, column 204.
    | ExtendableExpr starting at line 14, column 203.
    | ExtendableExpr starting at line 14, column 127.
    | Expression starting at line 14, column 127.
    | Fatal errors while parsing TLA+ spec in file random_09915
    | In module random_09915
    | Could not parse module random_09915 from file random_09915.tla
    | *** Errors: 1
    | In module random_09915
    | Could not parse module random_09915 from file random_09915.tla
    3002:1 Parsing or semantic analysis failed.
---*)
