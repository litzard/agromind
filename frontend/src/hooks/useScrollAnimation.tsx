import React, { useEffect, useRef, useState } from 'react';

interface UseScrollAnimationOptions {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
}

export const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
    const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options;
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
    const observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting) {
            setIsVisible(true);
            if (triggerOnce && ref.current) {
                observer.unobserve(ref.current);
            }
            } else if (!triggerOnce) {
            setIsVisible(false);
            }
        },
        { threshold, rootMargin }
    );

    const currentRef = ref.current;
    if (currentRef) {
        observer.observe(currentRef);
    }

    return () => {
        if (currentRef) {
            observer.unobserve(currentRef);
        }
    };
    }, [threshold, rootMargin, triggerOnce]);

    return { ref, isVisible };
};

interface ScrollAnimationProps {
    children: React.ReactNode;
    className?: string;
    animation?: 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight' | 'scale' | 'fade';
    delay?: number;
    duration?: number;
}

export const ScrollAnimation: React.FC<ScrollAnimationProps> = ({
    children,
    className = '',
    animation = 'fadeUp',
    delay = 0,
    duration = 600,
}) => {
    const { ref, isVisible } = useScrollAnimation();

    const baseStyles: React.CSSProperties = {
        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
        transitionDelay: `${delay}ms`,
    };

    const animations: Record<string, { hidden: React.CSSProperties; visible: React.CSSProperties }> = {
        fadeUp: {
        hidden: { opacity: 0, transform: 'translateY(40px)' },
        visible: { opacity: 1, transform: 'translateY(0)' },
        },
        fadeDown: {
        hidden: { opacity: 0, transform: 'translateY(-40px)' },
        visible: { opacity: 1, transform: 'translateY(0)' },
        },
        fadeLeft: {
        hidden: { opacity: 0, transform: 'translateX(-40px)' },
        visible: { opacity: 1, transform: 'translateX(0)' },
        },
        fadeRight: {
        hidden: { opacity: 0, transform: 'translateX(40px)' },
        visible: { opacity: 1, transform: 'translateX(0)' },
        },
        scale: {
        hidden: { opacity: 0, transform: 'scale(0.9)' },
        visible: { opacity: 1, transform: 'scale(1)' },
        },
        fade: {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        },
    };

    const currentAnimation = animations[animation];
    const animationStyles = isVisible ? currentAnimation.visible : currentAnimation.hidden;

    return (
        <div
        ref={ref}
        className={className}
        style={{ ...baseStyles, ...animationStyles }}
        >
        {children}
        </div>
    );
};
