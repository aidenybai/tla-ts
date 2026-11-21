(set-option :auto_config false)
(set-option :smt.mbqi true)
(set-option :rlimit 4859)
(set-logic UFNIA)
(declare-sort Idv 0)
(declare-fun TBoolSet () Idv)
(declare-fun TFunApp (Idv Idv) Idv)
(declare-fun TFunDom (Idv) Idv)
(declare-fun TFunIsafcn (Idv) Bool)
(declare-fun TFunSet (Idv Idv) Idv)
(declare-fun TMem (Idv Idv) Bool)
(declare-fun TRecordSet__smoking (Idv) Idv)
(declare-fun TRecord__smoking (Idv) Idv)
(declare-fun TSetEnum__0 () Idv)
(declare-fun TSetEnum__1 (Idv) Idv)
(declare-fun TSetExtTrigger (Idv Idv) Bool)
(declare-fun TSetMinus (Idv Idv) Idv)
(declare-fun TStrLit__smoking () Idv)
(declare-fun TStrSet () Idv)
(assert
  (!
    (forall ((x Idv) (y Idv))
      (!
        (=>
          (forall ((z Idv))
            (= (TMem z x)
              (TMem z y))) (= x y))
        :pattern ((TSetExtTrigger x y))))
    :named |SetExt|))
(assert
  (!
    (forall ((a Idv) (b Idv) (x Idv))
      (!
        (= (TMem x (TSetMinus a b))
          (and (TMem x a)
            (not (TMem x b))))
        :pattern ((TMem x
                    (TSetMinus a b)))
        :pattern ((TMem x a)
                   (TSetMinus a b))
        :pattern ((TMem x b)
                   (TSetMinus a b))))
    :named |SetMinusDef|))
(assert
  (!
    (forall ((f Idv) (g Idv))
      (!
        (=>
          (and (TFunIsafcn f) (TFunIsafcn g)
            (= (TFunDom f) (TFunDom g))
            (forall ((x Idv))
              (=> (TMem x (TFunDom f))
                (= (TFunApp f x)
                  (TFunApp g x))))) (= f g))
        :pattern ((TFunIsafcn f)
                   (TFunIsafcn g)))) :named |FunExt|))
(assert
  (!
    (forall ((a Idv) (b Idv) (f Idv))
      (!
        (=>
          (and (TFunIsafcn f)
            (= (TFunDom f) a)
            (forall ((x Idv))
              (=> (TMem x a)
                (TMem (TFunApp f x) b))))
          (TMem f (TFunSet a b)))
        :pattern ((TMem f (TFunSet a b)))))
    :named |FunSetIntro|))
(assert
  (!
    (forall ((a Idv) (b Idv) (f Idv))
      (!
        (=> (TMem f (TFunSet a b))
          (and (TFunIsafcn f)
            (= (TFunDom f) a)))
        :pattern ((TMem f (TFunSet a b)))))
    :named |FunSetElim1|))
(assert
  (!
    (forall ((a Idv) (b Idv) (f Idv) (x Idv))
      (!
        (=>
          (and (TMem f (TFunSet a b))
            (TMem x a))
          (TMem (TFunApp f x) b))
        :pattern ((TMem f (TFunSet a b))
                   (TMem x a))
        :pattern ((TMem f (TFunSet a b))
                   (TFunApp f x)))) :named |FunSetElim2|))
(assert
  (!
    (forall ((a1 Idv))
      (! (TMem a1 (TSetEnum__1 a1))
        :pattern ((TSetEnum__1 a1)))) :named |EnumDefIntro 1|))
(assert
  (!
    (forall ((x Idv))
      (! (not (TMem x TSetEnum__0))
        :pattern ((TMem x TSetEnum__0))))
    :named |EnumDefElim 0|))
(assert
  (!
    (forall ((a1 Idv) (x Idv))
      (!
        (=> (TMem x (TSetEnum__1 a1))
          (= x a1))
        :pattern ((TMem x (TSetEnum__1 a1)))))
    :named |EnumDefElim 1|))
(assert
  (! (TMem TStrLit__smoking TStrSet)
    :named |StrLitIsstr smoking|))
(assert
  (!
    (forall ((x1 Idv))
      (! (TFunIsafcn (TRecord__smoking x1))
        :pattern ((TRecord__smoking x1))))
    :named |RecIsafcn smoking|))
(assert
  (!
    (forall ((x1 Idv))
      (!
        (= (TFunDom (TRecord__smoking x1))
          (TSetEnum__1 TStrLit__smoking))
        :pattern ((TRecord__smoking x1))))
    :named |RecDomDef smoking|))
(assert
  (!
    (forall ((x1 Idv))
      (!
        (=
          (TFunApp (TRecord__smoking x1)
            TStrLit__smoking) x1)
        :pattern ((TRecord__smoking x1))))
    :named |RecAppDef smoking|))
(assert
  (!
    (forall ((s1 Idv) (x1 Idv))
      (!
        (=> (TMem x1 s1)
          (TMem (TRecord__smoking x1)
            (TRecordSet__smoking s1)))
        :pattern ((TRecord__smoking x1)
                   (TRecordSet__smoking s1))))
    :named |RecSetIntro smoking|))
(assert
  (!
    (forall ((s1 Idv) (r Idv))
      (!
        (=> (TMem r (TRecordSet__smoking s1))
          (and
            (= r
              (TRecord__smoking
                (TFunApp r TStrLit__smoking)))
            (TMem
              (TFunApp r TStrLit__smoking) 
              s1)))
        :pattern ((TMem r
                    (TRecordSet__smoking s1)))))
    :named |RecSetElim smoking|))
(declare-fun CIngredients () Idv)
(declare-fun COffers () Idv)
(declare-fun Vsmokers () Idv)
(declare-fun Vdealer () Idv)
(assert
  (and
    (TMem Vsmokers
      (TFunSet CIngredients
        (TRecordSet__smoking TBoolSet)))
    (or (TMem Vdealer COffers)
      (= Vdealer TSetEnum__0))))
(assert (TMem Vdealer COffers))
(declare-fun Cm () Idv)
(assert
  (TMem Cm
    (TSetMinus CIngredients
      Vdealer)))
(assert
  (!
    (not
      (and (TMem Cm CIngredients)
        (not (TMem Cm Vdealer))))
    :named |Goal|))
(check-sat)
