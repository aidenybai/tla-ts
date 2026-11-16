(*---
description: Evaluates a random bool expression, seed 262, number 7276.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07276 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b11202 \in (UNION {UNION {{x \in 1..3 : x > 1}, {x \in 1..3 : x > 1}}, {b11203 \in [a |-> 1] : FALSE}} \cup ((--1) .. Len({1}))) : (DOMAIN (b11202 :> 7) = ({b11204 \in {1} : FALSE} \cup [[x \in 1..2 |-> x] EXCEPT ![1] = b11202]))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 132 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 129.
    | Expression starting at line 14, column 129.
    | ExtendableExpr starting at line 14, column 128.
    | ExtendableExpr starting at line 14, column 38.
    | Expression starting at line 14, column 32.
    | Fatal errors while parsing TLA+ spec in file random_07276
    | In module random_07276
    | Could not parse module random_07276 from file random_07276.tla
    | *** Errors: 1
    | In module random_07276
    | Could not parse module random_07276 from file random_07276.tla
    3002:1 Parsing or semantic analysis failed.
---*)
