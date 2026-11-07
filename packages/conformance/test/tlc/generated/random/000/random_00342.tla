(*---
description: Evaluates a random seq expression, seed 262, number 342.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00342 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq(<<(<<5, 6>>)[3], (2147483647 \div -1)>>, (Cardinality(SUBSET {1}) * Len(<<1>>)), (IF FALSE THEN 2147483647 ELSE -1 - ([a |-> 1]).a)), LET b576 == IF ([a |-> 1, b |-> TRUE] = [a |-> 1]) THEN (2 * -1) ELSE IF TRUE THEN 2 ELSE 2 IN (CASE FALSE -> 2147483647 [] OTHER -> b576 % (b576 % b576))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 59 to line 14, col 62 of module random_00342 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 48.
    | Expression starting at line 14, column 48.
    | ExtendableExpr starting at line 14, column 47.
    | Expression starting at line 14, column 47.
    | Some << -- >> or >>_ Form starting at line 14, column 30.
    | Fatal errors while parsing TLA+ spec in file random_00342
    | In module random_00342
    | Could not parse module random_00342 from file random_00342.tla
    | *** Errors: 1
    | In module random_00342
    | Could not parse module random_00342 from file random_00342.tla
    3002:1 Parsing or semantic analysis failed.
---*)
