(*---
description: Evaluates a random seq expression, seed 262, number 9056.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09056 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append(((<<>> \o [a |-> 1]) \o SortSeq(<<1>>, LAMBDA p, q : p < q)), CASE (SUBSET {1} = 2..1) -> (--1) [] OTHER -> (7 * 3)), (CHOOSE b14077 \in {LET b14079 == 7 IN b14079 : b14078 \in UNION {1..3, {2, 1, 3}}} : ((b14077 .. 2) = {b14077, b14077}))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 123 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 120.
    | Expression starting at line 14, column 120.
    | Case Arm starting at line 14, column 97.
    | CASE Expression starting at line 14, column 92.
    | Expression starting at line 14, column 92.
    | Fatal errors while parsing TLA+ spec in file random_09056
    | In module random_09056
    | Could not parse module random_09056 from file random_09056.tla
    | *** Errors: 1
    | In module random_09056
    | Could not parse module random_09056 from file random_09056.tla
    3002:1 Parsing or semantic analysis failed.
---*)
