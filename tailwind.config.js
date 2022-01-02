module.exports = {
    content: [
        './**/*.html',
        './**/*.tsx',
        './**/*.ts',
    ],
    theme: {
        container: {
            center: true,
            padding: "1rem",
        },
    },
    variants: {},
    plugins: [
        require("@tailwindcss/typography"),
    ],
}
