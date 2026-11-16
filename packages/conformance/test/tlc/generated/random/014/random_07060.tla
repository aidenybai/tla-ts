(*---
description: Evaluates a random function expression, seed 262, number 7060.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07060 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10839 \in UNION {((TRUE /\ [x \in 1..2 |-> x]) \cup (3 .. 2)), UNION {({} \cup SUBSET {1}), ({} \cap SUBSET {1})}} |-> (LET b10840 == (--1) IN (0 \div [x \in Nat |-> x + 1]) - Len([<<>> EXCEPT ![1] = b10839]))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 155 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 152.
    | Expression starting at line 14, column 152.
    | Definition starting at line 14, column 142.
    | Let Definitions starting at line 14, column 142.
    | Case Other Arm starting at line 14, column 138.
    | Fatal errors while parsing TLA+ spec in file random_07060
    | In module random_07060
    | Could not parse module random_07060 from file random_07060.tla
    | *** Errors: 1
    | In module random_07060
    | Could not parse module random_07060 from file random_07060.tla
    3002:1 Parsing or semantic analysis failed.
---*)
