(*---
description: Evaluates a random set expression, seed 262, number 957.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00957 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((CHOOSE b1543 \in {b1544 \in {x \in 1..3 : x > 1} : TRUE} : (FALSE /\ TRUE)) * Head(SortSeq(<<1>>, LAMBDA p, q : p < q))) : b1542 \in {((--1) % (CHOOSE b1546 \in SUBSET {1} : FALSE)) : b1545 \in {b1547 \in UNION {FALSE, {x \in 1..3 : x > 1}} : (TRUE <=> TRUE)}}})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 157 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 154.
    | Expression starting at line 14, column 154.
    | ExtendableExpr starting at line 14, column 153.
    | Expression starting at line 14, column 153.
    | Some { } form starting at line 14, column 152.
    | Fatal errors while parsing TLA+ spec in file random_00957
    | In module random_00957
    | Could not parse module random_00957 from file random_00957.tla
    | *** Errors: 1
    | In module random_00957
    | Could not parse module random_00957 from file random_00957.tla
    3002:1 Parsing or semantic analysis failed.
---*)
