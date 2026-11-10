(*---
description: Evaluates a random seq expression, seed 262, number 9601.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09601 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append(SubSeq(<<<<3, 1, 2>>, 2>>, (<<5, 6>>)[3], (--1)), ((2147483647 % 2147483647) - (-2))), Cardinality((({} \cap {1, 2}) \cap (2 .. 2147483647))), ([(CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \ {1}] : TRUE) EXCEPT ![([a |-> 1, b |-> TRUE] * -1)] = (3 + 3)])[Len(SelectSeq(<<1>>, LAMBDA e : e > 0))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 75 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 72.
    | Expression starting at line 14, column 72.
    | Optional Arguments starting at line 14, column 36.
    | Primitive expression starting at line 14, column 30.
    | ExtendableExpr starting at line 14, column 30.
    | Fatal errors while parsing TLA+ spec in file random_09601
    | In module random_09601
    | Could not parse module random_09601 from file random_09601.tla
    | *** Errors: 1
    | In module random_09601
    | Could not parse module random_09601 from file random_09601.tla
    3002:1 Parsing or semantic analysis failed.
---*)
