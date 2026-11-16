(*---
description: z3test's regression regressions/issues/4889.smt2.
ref: regressions/issues/4889.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)

(declare-fun a () RoundingMode)
(declare-fun b () Float64)
(declare-fun c () Float64)
(declare-fun d () Float64)
(assert
 (= ((_ to_fp 11 53) a 1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000.0)
 c (fp.add a c d) b))
(check-sat)
;(get-model)

(reset)
(define-fun c () Float64 (fp #b0 #b10101000111 #xd42aea2879f2f))
(define-fun b () Float64 (fp #b0 #b10101000111 #xd42aea2879f2f))
(define-fun d () Float64 (fp #b0 #b00000000000 #xffffffffffdfe))
(define-fun a () RoundingMode roundTowardZero)
(assert
 (= ((_ to_fp 11 53) a 1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000.0)
 c (fp.add a c d) b))
(check-sat)
(exit)

(set-info :status unsat)
(declare-fun r () (_ FloatingPoint 11 53))
(declare-fun x () (_ FloatingPoint 11 53))
(assert
 (forall ((y (_ FloatingPoint 11 53)) )(let ((?x14 (fp (_ bv1 1) (_ bv1395 11) (_ bv3745288593203359 52))))
 (let (($x53 (= y ?x14)))
 (let (($x17 (= r ?x14)))
 (let (($x56 (not (= (fp.min x y) r))))
 (let (($x10 (= x (fp (_ bv1 1) (_ bv9 11) (_ bv1090604990256491 52)))))
 (let (($x57 (or $x10 $x56 $x17 $x53)))
 (let (($x58 (or $x53 $x17 $x56 $x10)))
 (let (($x59 (or $x53 $x17 $x10 $x56)))
 (let (($x60 (or $x56 $x53 $x10 $x17)))
 (let (($x43 (or $x17)))
 (let (($x65 (or $x53 $x10 $x17 $x56)))
 (let (($x66 (or $x56 $x17 $x53 $x10)))
 (let (($x67 (or $x56)))
 (let (($x70 (or $x10 $x56 $x17))) 
 (and (or $x17 $x53 $x10) (or $x53 $x56 $x17 $x10) $x59 $x65 $x66 $x66 $x67 (or $x17 $x56 $x10 $x53) (or $x10 $x17 $x56) (or $x10 $x56 $x53 $x17) (or $x17 $x53) $x57 $x70 (or $x53 $x56 $x10 $x17) (or $x10 $x56) (or $x56 $x10 $x17 $x53) (or $x10 $x17 $x53 $x56) (or $x56 $x17 $x10) (or $x53 $x10 $x56 $x17) (or $x17 $x10 $x53 $x56) $x70 (or $x17 $x10 $x56 $x53) (or $x17 $x53 $x56 $x10) $x43 $x67 $x66 (or $x10) $x65 $x59 (or $x10 $x53 $x56 $x17) $x59 $x43 (or $x10 $x17 $x56 $x53) $x60 $x58 (or $x56 $x53 $x17 $x10) (or $x17 $x56 $x53) $x60 $x59 $x58 $x57))))))))))))))))
 )
(check-sat)
(get-model)
(exit)

(declare-fun a () RoundingMode)
(declare-fun b () Float64)
(declare-fun c () Float64)
(declare-fun d () Float64)
(assert (= (= d c) (= ((_ to_fp 11 53) a (* 88722839111672996637.0 125000000000000000.0)) b)))
(check-sat)
(get-model)
(exit)

(set-info :status unknown)
(set-option :smt.phase_selection 5)
(set-option :smt.threads 2)
(declare-fun a () RoundingMode)
(declare-fun b () (_ FloatingPoint 5 11))
(assert (fp.leq b ((_ to_fp 5 11) a (_ bv0 2))))
(check-sat-using (then bit-blast qfaufbv))
(exit)

(define-sort FP () (_ FloatingPoint 3 5))
(define-fun a () FP (fp #b0 #b000 #b1111))
(define-fun b () FP (fp #b0 #b110 #b1111))
(define-fun c () FP (fp #b1 #b110 #b1111))
(define-fun d () FP (fp #b0 #b100 #b0000))
(declare-fun e () FP)
(declare-fun f () FP)
(define-fun g ((s FP) (t FP)) Bool
 (and
  (not (fp.isInfinite t))
  (not (fp.isInfinite e))
  (not (fp.isNaN t))
  (fp.isNaN e)
  (= (and (fp.isSubnormal e) (fp.isNormal t))
   (fp.isInfinite (fp.fma RNA s t (ite (= (fp.isZero e) (fp.isPositive t)) c b))))))
(assert (xor (g e f) (exists ((x FP)) (fp.isNormal (fp.fma RNA e f x)))))
(check-sat)
(exit)

(set-info :status unsat)
(declare-const b Float32)
(assert (forall ((d Float32)) (not (fp.isPositive (fp.max b d)))))
(check-sat)
(exit)

(declare-fun a () RoundingMode)
(declare-fun b () Float64)
(declare-fun c () Float64)
(declare-fun d () Float64)
(assert
 (= ((_ to_fp 11 53) a 1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000.0)
  c (fp.add a c d) b))
(check-sat)
(get-model)

(reset)

(define-fun c () Float64 (fp #b0 #b10101000111 #xd42aea2879f2f))
(define-fun b () Float64 (fp #b0 #b10101000111 #xd42aea2879f2f))
(define-fun d () Float64 (fp #b0 #b00000000000 #xffffffffffdfe))
(define-fun a () RoundingMode roundTowardZero)
(assert
 (= ((_ to_fp 11 53) a 1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000.0)
  c (fp.add a c d) b))
(check-sat)
(exit)

(set-option :rewriter.elim_and true)
(set-option :smt.phase_selection 0)
(set-option :smt.threads 2)
(declare-fun fpv0 () Float32)
(declare-fun fpv6 () Float32)
(declare-fun fpv7 () Float32)
(declare-fun v7 () Bool)
(declare-fun v9 () Bool)
(assert (xor v9 v7))
(push)
(check-sat)
(assert (fp.eq (fp.neg fpv0) fpv7 fpv7 ((_ to_fp 8 24) RTP 5.0) (fp.abs (fp.add RTN fpv7 fpv6))))
(check-sat)
(get-model)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    unsat
---*)
