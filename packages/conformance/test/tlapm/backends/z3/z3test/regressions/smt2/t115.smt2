(*---
description: z3test's regression regressions/smt2/t115.smt2.
ref: regressions/smt2/t115.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const a (_ BitVec 8))
(declare-const b (_ BitVec 8))

(simplify (= (bvsub a b) #x01))
(simplify (= (bvsub a b) #x00))
(simplify (= (bvadd (bvmul #xff a) b) #x01))
(simplify (= (bvadd (bvmul #xff a) b) #x00))
(simplify (= (bvadd (bvmul #xff a) (bvmul #xff b)) #x01))
(simplify (= (bvadd (bvmul #xff a) (bvmul #xff b)) #x00))
(simplify (= (bvadd (bvmul #xfa a) (bvmul #xff b)) #x01))
(simplify (= (bvadd (bvmul #xfa a) (bvmul #xff b)) #x00))
(simplify (= (bvadd (bvmul #xfa a) (bvmul #xfb b)) #x01))
(simplify (= (bvadd (bvmul #xfa a) (bvmul #xfb b)) #x00))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (= a (bvadd #x01 b))
    (= a b)
    (= b (bvadd #x01 a))
    (= b a)
    (= a (bvadd #xff (bvmul #xff b)))
    (= a (bvmul #xff b))
    (= b (bvadd #xff (bvmul #xfa a)))
    (= b (bvmul #xfa a))
    (= b (bvadd #x33 (bvmul #x32 a)))
    (= b (bvmul #x32 a))
---*)
