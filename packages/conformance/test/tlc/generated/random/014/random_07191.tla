(*---
description: Evaluates a random bool expression, seed 262, number 7191.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07191 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((\A b11048 \in UNION {FALSE, {2, 1, 3}} : (FALSE \/ TRUE)) <=> ((-1 \in Nat) <=> (3 \in SUBSET {1}))) /\ {([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1]).a : b11049 \in {Cardinality({x \in 1..3 : x > 1}), (--1)}}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 220 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 217.
    | Expression starting at line 14, column 217.
    | Some { } form starting at line 14, column 181.
    | ExtendableExpr starting at line 14, column 181.
    | Expression starting at line 14, column 181.
    | Fatal errors while parsing TLA+ spec in file random_07191
    | In module random_07191
    | Could not parse module random_07191 from file random_07191.tla
    | *** Errors: 1
    | In module random_07191
    | Could not parse module random_07191 from file random_07191.tla
    3002:1 Parsing or semantic analysis failed.
---*)
